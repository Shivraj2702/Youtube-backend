import mongoose, { isValidObjectId } from "mongoose"
import {Comment} from "../models/comment.model.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"
import {Video} from "../models/video.model.js"

const getVideoComments = asyncHandler(async (req, res) => {
   
    const { videoId } = req.params;
    const { page = 1, limit = 10 } = req.query;
    
    if (!isValidObjectId(videoId)) {
        throw new ApiError(400, "Invalid videoId");
    }

    try {
        const video = await Video.findById(videoId);

        if (!video) {
            throw new ApiError(404, "Video not found");
        }

        const comments = await Comment.aggregate([
            {
                $match:{
                    video:new mongoose.Types.ObjectId(videoId)
                }
            },
            {
                $skip:(Number(page)-1)*limit
            },
            {
                $limit: Number(limit)
            },
            {
                $lookup:{
                    from:"users",
                    localField:"owner",
                    foreignField:"_id",
                    pipeline:[
                        {
                            $project:{
                                username:1,
                                fullName:1,
                                avatar:1
                            }
                        }
                    ],
                    as:"owner"
                }
            },
    
        ])

        const totalComments = await Comment.countDocuments({ video: videoId });

        const response = new ApiResponse(200 ,{
            
            data: {
                comments,
                page: Number(page),
                limit: Number(limit),
                totalComments,
            },
        });

        res.status(200).json(response);
    } catch (error) {
        
        console.error(error);
        throw new ApiError(500, "Internal Server  error while fetching comments");
    }
});

const addComment = asyncHandler(async (req, res) => {
  
    const {commentContent} = req.body
    const { videoId } = req.params

    if(!isValidObjectId(videoId)) {
        throw new ApiError(401 , "Invalid videoId")
    }

    if(!commentContent) {
        throw new ApiError(401 , "comment is required")
    }

    const video = await Video.findById(videoId)

    if(!video) {
        throw new ApiError(401 , "video not found")
    }

    const comment = await Comment.create({
        content : commentContent,
        video,
        owner: req.user._id
    })

    if(!comment) {
        throw new ApiError(401 , "comment not created")
    }

    return res.status(200).json(new ApiResponse(200, comment, "Comment Added successfully"))
})

const updateComment = asyncHandler(async (req, res) => {
  
    const { commentContent } = req.body
    const {videoId} = req.params
    const { commentId } = req.params

    if(!isValidObjectId(commentId)) {
        throw new ApiError(401 , "Invalid commentId")
    }

    if(!isValidObjectId(videoId)) {
        throw new ApiError(401 , "Invalid videoId")
    }

    if(!commentContent) {
        throw new ApiError(401 , "comment is required")
    }

  try {
      const comment = await Comment.findById(commentId)
  
      if(!comment) {
          throw new ApiError(401 , "comment not found")
      }
  
      const video = await Video.findById(videoId)
  
      if(!video) {
          throw new ApiError(401 , "video not found")
      }
  
      if(comment.owner.toString() !== req.user?._id.toString()){
          throw new ApiError(401 , "you dont have permission to update comment")
      }
  
      const updatedComment = await Comment.findByIdAndUpdate(
          commentId,
          {
              $set: {
                  content: commentContent,
                  video,
                  owner:req.user?._id
              }
          },
          {
              new: true
          }
      )
  
      if(!updatedComment) {
          throw new ApiError(401 , "something went wrong while updating commnet")
      }
  
      return res.status(200).json(new ApiResponse(200, updateComment, " upated commnet Successfully"))
  } catch (error) {
    throw new ApiError(500 , "Internal server error somethig went wrong while updating commnet")
  }
})

const deleteComment = asyncHandler(async (req, res) => {
    // TODO: delete a comment
    const { commentId } = req.params
    const { videoId } = req.params

    if(!isValidObjectId(commentId)) {
        throw new ApiError(401 , "Invalid commentId")
    }

    if(!isValidObjectId(videoId)) {
        throw new ApiError(401 , "Invalid videoId")
    }

    const video = await Video.findById(videoId)

    if(!video) {
        throw new ApiError(401 , "video not found")
    }

    const comment = await Comment.findById(commentId)

    
    if(!comment) {
        throw new ApiError(401 , "commnet not found")
    }

    if(comment.owner.toString() !== req.user?._id.toString()){
        throw new ApiError(401 , "you dont have permission to update comment")
    }

    const deletedComment = await Comment.findByIdAndDelete(commentId)

    
    if(!deletedComment) {
        throw new ApiError(401 , "something went wrog while deleting comment")
    }

    return res.status(200).json(new ApiResponse(200, {}, "deleted  comment successfully"))

})

export {
    getVideoComments, 
    addComment, 
    updateComment,
    deleteComment
    }