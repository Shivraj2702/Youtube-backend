import mongoose, { isValidObjectId } from "mongoose"
import {Comment} from "../models/comment.model.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"
import {Video} from "../models/video.model.js"

const getVideoComments = asyncHandler(async (req, res) => {
    const { videoId } = req.params;
    const { page = 1, limit = 10 } = req.query;

    const video = await Video.findById(videoId);

    if (!video) {
        throw new ApiError(404, "Video not found");
    }

    const commentsAggregate = Comment.aggregate([
        {
            $match: {
                video: new mongoose.Types.ObjectId(videoId)
            }
        },
        {
            $lookup: {
                from: "users",
                localField: "owner",
                foreignField: "_id",
                as: "owner"
            }
        },
        {
            $lookup: {
                from: "likes",
                localField: "_id",
                foreignField: "comment",
                as: "likes"
            }
        },
        {
            $addFields: {
                likesCount: {
                    $size: "$likes"
                },
                owner: {
                    $first: "$owner"
                },
                isLiked: {
                    $cond: {
                        if: { $in: [req.user?._id, "$likes.likedBy"] },
                        then: true,
                        else: false
                    }
                }
            }
        },
        {
            $sort: {
                createdAt: -1
            }
        },
        {
            $project: {
                content: 1,
                createdAt: 1,
                likesCount: 1,
                owner: {
                    username: 1,
                    fullName: 1,
                    avatar: 1
                },
                isLiked: 1
            }
        }
    ]);

    const options = {
        page: parseInt(page, 10),
        limit: parseInt(limit, 10)
    };

    const comments = await Comment.aggregatePaginate(
        commentsAggregate,
        options
    );

    return res
        .status(200)
        .json(new ApiResponse(200, comments, "Comments fetched successfully"));
});

const addComment = asyncHandler(async (req, res) => {
  
    const {content} = req.body
    const { videoId } = req.params

    if(!isValidObjectId(videoId)) {
        throw new ApiError(401 , "Invalid videoId")
    }

    if(!content) {
        throw new ApiError(401 , "comment is required")
    }

    const video = await Video.findById(videoId)

    if(!video) {
        throw new ApiError(401 , "video not found")
    }

    const comment = await Comment.create({
        content,
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