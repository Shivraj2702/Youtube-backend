import mongoose, {isValidObjectId} from "mongoose"
import {Like} from "../models/like.model.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"
import { Tweet } from "../models/tweet.model.js"
import { User } from "../models/user.model.js"
import { Comment } from "../models/comment.model.js"


const toggleVideoLike = asyncHandler(async (req, res) => {
    
    const { videoId } = req.params
  
    
    if(!isValidObjectId(videoId)) {
        throw new ApiError(401 , "video is not valid")
    }

    const likedVideos = await Like.findOne({video: videoId})

    if(likedVideos){

        const unlike =  await Like.deleteOne({ video : videoId})

       if(!unlike) {
        throw new ApiError(400 , "failed to unlike commet like")
    }
      return res.status(200).json(new ApiResponse(200, {}, "removed like"));

    } else {
       const  like = await Like.create({
            video: videoId,
            likeBy : req.user?._id
        })

        if(!like) {
            throw new ApiError(400 , " failed to like comment like")
        }
        console.log(like)

        return res.status(200).json(new ApiResponse(200, likedVideos || [], "like video successfully!!"));
    }

})

const toggleCommentLike = asyncHandler(async (req, res) => {
     
    const {commentId} = req.params
   
    if(!isValidObjectId(commentId)) {
        throw new ApiError(400 , "commentId invalid")
    }

    const commentLike = await Comment.findOne({ content : commentId})

    if(commentLike){
        const unlike =  await Comment.deleteOne({ content : commentId})

        if(!unlike) {
            throw new ApiError(400 , "failed to unlike commet like")
        }

          return res.status(200).json( new ApiResponse( 200 , {}, "removed comment like"))
    } else {
       const  like = await Comment.create({
            video: commentId,
            likeBy: req.user._id
        })

        if(!like) {
            throw new ApiError(400 , " failed to like comment like")
        }

        return res.status(200).json( new ApiResponse( 200 ,like, "successfully like the comment"))
    }
})

const toggleTweetLike = asyncHandler(async (req, res) => {
    const {tweetId} = req.params
    
    if(!isValidObjectId(tweetId)) {
        throw new ApiError(400 , "tweetId invalid")
    }

    const tweetLike = await Tweet.findOne({ tweet : tweetId})

    if(tweetLike){
        const unlike = await Tweet.deleteOne({ tweet : tweetId})

        if(!unlike) {
            throw new ApiError(400 , "failed to unlike commet like")
        }

        return res.status(200).json( new ApiResponse( 200 , {}, "removed comment like"))
    } else {
      const   like = await Tweet.create({
            tweet: tweetId,
            likeBy: req.user._id
        })

        if(!like) {
            throw new ApiError(400 , " failed to like comment like")
        }

        return res.status(200).json( new ApiResponse( 200 , like,  "video like successfully "))
    }

}
)

const getLikedVideos = asyncHandler(async (req, res) => {
  
    const {userId} = req.params

    if(!isValidObjectId(userId)){
        throw new ApiError(400, "This user id is not valid")
    }

    const user = await User.findById(userId)
    if (!user) {
        throw new ApiError(404, "User not found");
    }

    const likes = await Like.aggregate([

        {
            $lookup:{
                from: "videos",
                localField: "video",
                foreignField: "_id",
                as: "likedVideos",
                pipeline:[
                    {
                        $lookup:{
                            from: "users",
                            localField: "videoOwner",
                            foreignField: "_id",
                            as: "videoOwner",
                            pipeline:[
                                {
                                    $project:{
                                        fullName: 1,
                                        username: 1,
                                        avatar: 1
                                    }
                                }
                            ]
                        }
                    },
                    {
                        $addFields:{
                            videoOwner:{
                                $arrayElemAt: ["$videoOwner" , 0]
                            }
                        }
                    }
                ]
            }
        },

    ]) 

    return res
    .status(200)
    .json(
        new ApiResponse(
            200,
            likes,
            "fetched Liked videos successfully !!"
        )
    )
})

export {
    toggleCommentLike,
    toggleTweetLike,
    toggleVideoLike,
    getLikedVideos
}