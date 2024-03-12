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
    const likedVideosAggegate = await Like.aggregate([
        {
            $match: {
                likedBy: new mongoose.Types.ObjectId(req.user?._id),
            },
        },
        {
            $lookup: {
                from: "videos",
                localField: "video",
                foreignField: "_id",
                as: "likedVideo",
                pipeline: [
                    {
                        $lookup: {
                            from: "users",
                            localField: "owner",
                            foreignField: "_id",
                            as: "ownerDetails",
                        },
                    },
                    {
                        $unwind: "$ownerDetails",
                    },
                ],
            },
        },
        {
            $unwind: "$likedVideo",
        },
        {
            $sort: {
                createdAt: -1,
            },
        },
        {
            $project: {
                _id: 0,
                likedVideo: {
                    _id: 1,
                    videoFile: 1,
                    thumbnail: 1,
                    owner: 1,
                    title: 1,
                    description: 1,
                    views: 1,
                    duration: 1,
                    createdAt: 1,
                    isPublished: 1,
                    ownerDetails: {
                        username: 1,
                        fullName: 1,
                        avatar: 1,
                    },
                },
            },
        },
    ]);

    return res
        .status(200)
        .json(
            new ApiResponse(
                200,
                likedVideosAggegate,
                "liked videos fetched successfully"
            )
        );
});

export {
    toggleCommentLike,
    toggleTweetLike,
    toggleVideoLike,
    getLikedVideos
}