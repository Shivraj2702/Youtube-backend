import  { isValidObjectId } from "mongoose"
import {Tweet} from "../models/tweet.model.js"
import {User} from "../models/user.model.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"

const createTweet = asyncHandler(async (req, res) => {
    //TODO: create tweet
   
     const {content} = req.body
 
     if(!content){
         throw new ApiError(401 , 'content is required ')
     }
     try {
 
     const tweet = await Tweet.create({
         content,
         owner : req.user?._id
     })
 
     if(!tweet){
         throw new ApiError(401, 'Unable to create tweet')
     }
 
      return res
      .status(200)
      .json( new ApiResponse(200, 'Successfully created Tweet'))
   } catch (error) {
        throw new ApiError(500 , 'Something went wrong while creating tweet')
   }

})

const getUserTweets = asyncHandler(async (req, res) => {
    // TODO: get user tweets
    const { userId } = req.params

    if(!isValidObjectId(userId)) {
        throw new ApiError(401, "userId invalid")
    }

   try {
     const user = await User.findById(userId)
 
     if(!user){
         throw new ApiError(401, "user is not authanticated")
     }
 
     const userTweets = await Tweet.find({owner: userId}) 
         
     if(!userTweets) {
         throw new ApiError(401, "tweets not found")
     }
 
     return res
     .status(200)
     .json( new ApiResponse(201, userTweets, "Successfully tweets fetched"))
   } catch (error) {
        throw new ApiError(500, "Internal server error while fetching user tweets ")
   }

})

const updateTweet = asyncHandler(async (req, res) => {
    //TODO: update twwt
    const {tweetId} = req.params
    const { content } = req.body

    if(!tweetId){
        throw new ApiError(401, 'TweetId doest found')
    }

    if(!content){
        throw new ApiError(401, 'content is required')
    }

  try {
      const tweet = await Tweet.findById(tweetId)
  
      if(!tweet) {
          throw new ApiError(401 , 'Tweet owner dosnt found')
      }
  
      if(tweet.owner.toString() !== req.user._id.owner.toString()){
          throw new ApiError(401 , 'Unathrozied owner')
      }
  
      const UpdatedTweet = await Tweet.findByIdAndUpdate(tweetId , {
              $set: {
                content
            }
  
          },
          {
          new: true
          })
  
     if(!updateTweet){
          throw new ApiError(401 , " Something went wrong while updaing tweet")
         }
  
     return res
        .status(200)
         .json(
           new ApiResponse( 201 , {} , "Successfully updated the tweet")
         )
     } catch (error) {
            throw new ApiError(500 , ' Something went wrong in server while updating tweet')
     }

})

const deleteTweet = asyncHandler(async (req, res) => {
    //TODO: delete tweet
    const { tweetId} = req.params
    
    const { tweetContent} = req.body

    if(!tweetId) {
        throw new ApiError(402 , " Tweet id required")
    }

    
    if(!tweetContent) {
        throw new ApiError(402 , " TweetContent id required")
    }

   try {
     const existingTweet = await Tweet.findById(tweetId) 
     
     if(!existingTweet) {
         throw new ApiError(401 , "Tweet dosnt Found ")
     }
 
     if(existingTweet.owner.toString() !== req.user._id.owner.toString()){
         throw new ApiError(401, " Unathorized owner")
     }
 
     const deletedTweet = await Tweet.findByIdAndDelete(tweetId) 
 
     if(!deletedTweet){
         throw new ApiError(401 , " failed to delete tweet")
     }
 
     return res
     .status(200)
     .json( new ApiResponse(201, " Succesffuly deleted the tweet"))
   } catch (error) {
           throw new ApiError(500, 'Internal error failed to delete tweet')
   }
})

export {
    createTweet,
    getUserTweets,
    updateTweet,
    deleteTweet
}