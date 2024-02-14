import mongoose, {isValidObjectId} from "mongoose"
import { Video } from "../models/video.model.js"
import {User} from "../models/user.model.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"
import {uploadOnCloudinary} from "../utils/cloudinary.js"


const getAllVideos = asyncHandler(async (req, res) => {
    const { page = 1, limit = 10, query, sortBy, sortType, userId } = req.query;


    const filter = {};

    if (query) {
        filter.$or = [
            { title: { $regex: query, $options: 'i' } }, // Case-insensitive search in the title
            { description: { $regex: query, $options: 'i' } } // Case-insensitive search in the description
        ];
    }

    if (userId) {
        filter.userId = userId;
    }

    
    const sort = {};
    if (sortBy && sortType) {
        sort[sortBy] = sortType === 'asc' ? 1 : -1;
    }

    
    const skip = (page - 1) * limit;

  
    const videos = await Video.find(filter)
        .sort(sort)
        .skip(skip)
        .limit(parseInt(limit));

    if(!videos) {
        throw new ApiError(401, " Video not found")
    }

    return res.status(200).json({
        success: true,
        data: videos,
        message: 'Videos retrieved successfully',
    });
});

const publishAVideo = asyncHandler(async (req, res) => {
    const { title, description } = req.body

    // TODO: get video, upload to cloudinary, create video
    if(!title  || !description){
        throw new ApiError(401 , "title and description is needed")
    }
 
    try {
        

        const videoLocalPath = req.files?.videoFile[0]?.path
        const thumbnailLocalPath = req.files?.thumbNail[0]?.path

        console.log("videolocalpath")
    
        const video = await uploadOnCloudinary(videoLocalPath) 

        

        const thumbnail = await uploadOnCloudinary(thumbnailLocalPath) 
    
        if(!video) {
            throw new ApiError(401 , "video is required ")
        }

        if(!thumbnail) {
            throw new ApiError(401 , "thumbnai is required ")
        }


        
        const newVideo = await Video.create({
            videoFile: video?.url,
            thumbNail: thumbnail?.url,
            title,
            description,
            duration: video.duration,
            isPublished:true,
            owner:req.user?._id
        })

        if(!newVideo) {
            throw new ApiError(401 , "video is not created" )
        }
        
        return res.status(200).json( new ApiResponse(200 , newVideo , "video uploaded successsfully"))

    } catch (error) {
        throw new ApiError(500 , "Internal server error while uploading video")
    }
})

const getVideoById = asyncHandler(async (req, res) => {
    const { videoId } = req.params
    //TODO: get video by id
    if(!isValidObjectId(videoId)){
        throw new ApiError(401 , "Invalid videoId")
    }

    const video = await Video.findById(videoId)

    if(!video) {
        throw new ApiError(401 , "video not found")
    }

    return res
    .status(200)
    .json(new ApiResponse(200,video,"Video fetched Successfully"))
})

const updateVideo = asyncHandler(async (req, res) => {
    const { videoId } = req.params
   
    if(!isValidObjectId(videoId)){
        throw new ApiError(401 , "Invalid videoId")
    }

    const video = await Video.findById(videoId)

    if(!video) {
        throw new ApiError(401 , "video not found")
    }

    if( video.owner.toString() !== req.user?._id.toString()) {
        throw new ApiError(401 , "you dont have permission to update video")
    }

    const { title, description } = req.body

    if(!title || !description){
        throw new ApiError(401 , "title and description is needed")
    }

    const thumbnail  = req.files?.thumbNail[0].path

    const updatedVideo = await Video.findByIdAndUpdate(
        videoId, 
        {
            $set : {
                title,
                description,
                thumbNail: thumbnail?.url
            },
        },
        {
            new: true
        }
    )

    if(!updatedVideo) {
        throw new ApiError(401 , " error while updateding video ")
    }

    return res
    .status(200)
    .json(new ApiResponse(200,updatedVideo,"Video updated successfully"))

})

const deleteVideo = asyncHandler(async (req, res) => {
    const { videoId } = req.params
    //TODO: delete video
    if(!isValidObjectId(videoId)){
        throw new ApiError(401 , "Invalid videoId")
    }

    const video = await Video.findById(videoId)

    if( video.owner.toString() !== req.user?._id.toString()) {
        throw new ApiError(401 , "you dont have permission to delete video")
    }

    const deletedVideo = await Video.findByIdAndDelete(videoId)

    if(!deletedVideo) {
        throw new ApiError(401 , " error while deleting video ")
    }

    return res
    .status(200)
    .json(new ApiResponse(200,{},"Video deleted successfully"))
})

const togglePublishStatus = asyncHandler(async (req, res) => {
    const { videoId } = req.params

    if(!isValidObjectId(videoId)){
        throw new ApiError(401 , "Invalid videoId")
    }

    const video = await Video.findById(videoId)
    
    if( video.owner.toString() !== req.user?._id.toString()) {
        throw new ApiError(401 , "you dont have permission to delete video")
    }
    

    const updatedVideo = await Video.findByIdAndUpdate(videoId,
        {
            $set:{
                isPublished : !video.isPublished

            }
        },
        {new:true})
    if(!updatedVideo){
        throw new ApiError(500,"Something went wrong while toggling the status")
    }

    return res
    .status(200)
    .json(new ApiResponse(200,updatedVideo," PublishStatus of the video  is toggled successfully"))
})



export {
    getAllVideos,
    publishAVideo,
    getVideoById,
    updateVideo,
    deleteVideo,
    togglePublishStatus
}