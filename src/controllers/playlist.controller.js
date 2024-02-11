import mongoose, {isValidObjectId} from "mongoose"
import {Playlist} from "../models/playlist.model.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"
import { Video} from '../models/video.model.js'


const createPlaylist = asyncHandler(async (req, res) => {
      //TODO: create playlist
    const {name, description} = req.body

    if(!name || !description) {
        throw new ApiError(401, " name and description is needed")
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
    const {userId} = req.params
    //TODO: get user playlists
    if(!isValidObjectId(userId)) {
        throw new ApiError(401, "Invalid user")
    }

    const user = await User.find(userId)

    if(!user) {
        throw new ApiError(400 ,  "user not found")
    }

    const playlist = await Playlist.aggregate([
        {
            $lookup: {
                from : "vidoes",
                localField: "video",
                foreignField: "_id",
                as: "videos"
            }
        },
        {
            $addFields: {
                playlist: {
                    $first: "$videos"
                }
            }
        }
    ])

    if(!playlist) {
        throw new ApiError(400 , "playlist not found")
    }

    return res.status(200).json(new ApiResponse ( 201 , playlist , "fetched user playlist successfuly"))
})

const getPlaylistById = asyncHandler(async (req, res) => {
    const {playlistId} = req.params
    //TODO: get playlist by id
    if(!isValidObjectId(playlistId)) {
        throw new ApiError(401 , "Invalid playlist")
    }

    const playlist = await Playlist.findById(playlistId)


    if( !playlist) {
        throw new ApiError(401 , "playlist not found")
    }
    
    return res.status(201).json(
        new ApiResponse(200, playlist, "playlist fetched  successfully!!"))

})

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

    if(Playlist.video.includes(videoId)) {
        throw new ApiError(401, "videoalready exists")
    }

    const Videoplaylist = await Playlist.findByIdAndUpdate(
        playlistId, 
        {
            $push: {
                video : videoId
            },
        },
        {
            new: true
        }
    )

    if(!Videoplaylist){
        throw new ApiError(500, "something went wrong while added video to playlist !!");
    }

    // return responce
    return res.status(201).json(
        new ApiResponse(200, Videoplaylist, " added video in playlist successfully!!"))   
})

const removeVideoFromPlaylist = asyncHandler(async (req, res) => {
    const {playlistId, videoId} = req.params
    // TODO: remove video from playlist
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

    if(!playlist.video.includes(videoId)) {
        throw new ApiError(401 , "video doesnt exists in playlist")
    }

    const videoRemoved = await Playlist.findByIdAndUpdate(videoId ,
        {
            $pull: {
                video: videoId
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
    //TODO: update playlist
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
                name: NewName,
                description: NewDescription
            }
            },
            {
                new: true
            }
        )

        if(!updatePlaylist){
            throw new ApiError(500, "something went wrong while updating playlist!!")
        }

        // return responce
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