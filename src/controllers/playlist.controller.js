import mongoose, {isValidObjectId} from "mongoose"
import {Playlist} from "../models/playlist.model.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"
import { Video} from '../models/video.model.js'
import { User } from "../models/user.model.js"


const createPlaylist = asyncHandler(async (req, res) => {
      
    const {name, description} = req.body

    if(!name || !description) {
        throw new ApiError(401, "name and description is needed")
    }

    
    const playlist = await Playlist.create({
        name,
        description, 
        owner: req.user._id
    })

    if(!playlist) {
        throw new ApiError(400, " playlist not created")
    }

    return res.status(200).json( new ApiResponse (201 , playlist, "successfully made playlist"))
})

const getUserPlaylists = asyncHandler(async (req, res) => {
    const { userId } = req.params;

    if (!isValidObjectId(userId)) {
        throw new ApiError(400, "Invalid userId");
    }

    const playlists = await Playlist.aggregate([
        {
            $match: {
                owner: new mongoose.Types.ObjectId(userId)
            }
        },
        {
            $lookup: {
                from: "videos",
                localField: "videos",
                foreignField: "_id",
                as: "videos"
            }
        },
        {
            $addFields: {
                totalVideos: {
                    $size: "$videos"
                },
                totalViews: {
                    $sum: "$videos.views"
                }
            }
        },
        {
            $project: {
                _id: 1,
                name: 1,
                description: 1,
                totalVideos: 1,
                totalViews: 1,
                updatedAt: 1
            }
        }
    ]);

    return res
    .status(200)
    .json(new ApiResponse(200, playlists, "User playlists fetched successfully"));

});

const getPlaylistById = asyncHandler(async (req, res) => {
    const { playlistId } = req.params;

    if (!isValidObjectId(playlistId)) {
        throw new ApiError(400, "Invalid PlaylistId");
    }

    const playlist = await Playlist.findById(playlistId);

    if (!playlist) {
        throw new ApiError(404, "Playlist not found");
    }

    const playlistVideos = await Playlist.aggregate([
        {
            $match: {
                _id: new mongoose.Types.ObjectId(playlistId)
            }
        },
        {
            $lookup: {
                from: "videos",
                localField: "videos",
                foreignField: "_id",
                as: "videos",
            }
        },
        {
            $match: {
                "videos.isPublished": true
            }
        },
        {
            $lookup: {
                from: "users",
                localField: "owner",
                foreignField: "_id",
                as: "owner",
            }
        },
        {
            $addFields: {
                totalVideos: {
                    $size: "$videos"
                },
                totalViews: {
                    $sum: "$videos.views"
                },
                owner: {
                    $first: "$owner"
                }
            }
        },
        {
            $project: {
                name: 1,
                description: 1,
                createdAt: 1,
                updatedAt: 1,
                totalVideos: 1,
                totalViews: 1,
                videos: {
                    _id: 1,
                    videoFile: 1,
                    thumbNail: 1,
                    title: 1,
                    description: 1,
                    duration: 1,
                    createdAt: 1,
                    views: 1
                },
                owner: {
                    username: 1,
                    fullName: 1,
                    avatar: 1
                }
            }
        }
        
    ]);

    return res
        .status(200)
        .json(new ApiResponse(200, playlistVideos[0], "playlist fetched successfully"));
});

const addVideoToPlaylist = asyncHandler(async (req, res) => {
    const {playlistId, videoId} = req.params

    if(!isValidObjectId(playlistId) || !isValidObjectId(videoId)){
        throw new ApiError(401  , "invalid playlistId or videoId")
    }

    const playlist = await Playlist.findById(playlistId)
   
    if(!playlist) {
        throw new ApiError(401 , " playlist does not found")
    }

    if(playlist.owner.toString() !== req.user?._id.toString()) {
        throw new ApiError(401 , "You dont have permission to add video")
    }

    const video = await Video.findById(videoId)
    
    if(!video) {
        throw new ApiError(401 , "video not found")
    }

    const Videoplaylist = await Playlist.findByIdAndUpdate(
        playlistId, 
        {
            $push: {
                videos : videoId
            },
        },
        {
            new: true
        }
    )

    if(!Videoplaylist){
        throw new ApiError(500, "something went wrong while added video to playlist !!");
    }

  
    return res.status(201).json(
        new ApiResponse(200, Videoplaylist, " added video in playlist successfully!!"))   
})

const removeVideoFromPlaylist = asyncHandler(async (req, res) => {
    const {playlistId, videoId} = req.params
    
    if(!isValidObjectId(playlistId) || !isValidObjectId(videoId)) {
        throw new ApiError(401 , "Invalid playlistId or videoId")
    }

    const video = await Video.findById(videoId) 

    if(!video) {
        throw new ApiError(401 , "video not found")
    }

    const playlist = await Playlist.findById(playlistId) 
 
    if(!playlist) {
        throw new ApiError(401 , "playlist not found")
    }

    if(playlist.owner.toString() !== req.user?._id.toString()) {
        throw new ApiError(401 , " you dont have perimission to remove video")
    }

    if (playlist.videos.indexOf(videoId) === -1) {
        throw new ApiError(401 , "video doesnt exists in playlist")
    }

    const videoRemoved = await Playlist.findByIdAndUpdate(playlistId,
        {
            $pull: {
                videos: videoId
            }
        },
        {
            new : true
        }
    )

    if(!videoRemoved) {
        throw new ApiError(401 , "video does not removed ")
    }

    return res.status(200).json( new ApiResponse( 201 , videoRemoved, "video removed successfully from playlis"))
})

const deletePlaylist = asyncHandler(async (req, res) => {
    const {playlistId} = req.params
    // TODO: delete playlist
    if(!isValidObjectId(playlistId)) {
        throw new ApiError(401 , "Invalid playlistId or videoId")
    }

    const playlist = await Playlist.findById(playlistId) 

    if(!playlist) {
        throw new ApiError(401 , "playlist not found")
    }

    if(playlist.owner.toString() !== req.user?._id.toString()) {
        throw new ApiError(401 , " you dont have perimission to delete playlist")
    }

    const removePlaylist = await Playlist.findByIdAndDelete(playlistId)
    
    if(!removePlaylist) {
        throw new ApiError(401, " somehing went wrong while removeing playlist")
    }

    return res.status(200).json( new ApiResponse( 201 , removePlaylist, "playlist removed successfully"))
})

const updatePlaylist = asyncHandler(async (req, res) => {
    const {playlistId} = req.params
    const {name, description} = req.body
  
   if( !name || !description) {
    throw new ApiError(403, "name and descrition is required");
   }
    
    const playlist = await Playlist.findById(playlistId)

    if (playlist.owner.toString() !== req.user._id.toString()) {
        throw new ApiError(403, "You don't have permission to update this playlist!");
    }

    const updatePlaylist = await Playlist.findByIdAndUpdate(
        playlistId,
            {
            $set:{
                name,
                description
            }
            },
            {
                new: true
            }
        )

        if(!updatePlaylist){
            throw new ApiError(500, "something went wrong while updating playlist!!")
        }

        return res.status(201).json(
        new ApiResponse(200, updatePlaylist, "playlist updated successfully!!"))
})

export {
    createPlaylist,
    getUserPlaylists,
    getPlaylistById,
    addVideoToPlaylist,
    removeVideoFromPlaylist,
    deletePlaylist,
    updatePlaylist
}