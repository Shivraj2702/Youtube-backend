import {asyncHandler} from "../utils/asyncHandler.js";
import {ApiError} from "../utils/ApiError.js"
import { User } from "../models/user.model.js";
import {uploadOnCloudinary} from "../utils/cloudinary.js"
import { ApiResponse } from "../utils/ApiResponse.js";
import  Jwt  from "jsonwebtoken";
import mongoose from "mongoose";


const generateAccessAndRefreshToken =  async (UserId) => {
     try {
        const user =await User.findById(UserId)
        const accessToken  = await user.generateAccesstoken()
        const refreshToken = await user.generateRefreshtoken()

         user.refreshToken = refreshToken
         await user.save({validateBeforeSave : false})

          return {refreshToken ,accessToken}
     } 
     catch (error) {
          throw new ApiError(501, "something went wrong while generating access and refresh token")
     }
}

const registerUser = asyncHandler( async (req , res) => {
     
   const {fullName , username, email , password} = req.body;

     if(
          [fullName , username, email ,password].some((feild) => 
           feild?.trim() ==="")        
     ){
          throw new ApiError(400 , " All feilds are required")
     }

    const existedUser =  await User.findOne({
          $or :[{ username }, { email }]
     })

     if(existedUser){
          throw new ApiError(401 , "user with email or username already register")
     }

     const avatarloacalPath = req.files?.avatar[0]?.path;

     let coverImageLocalPath 
     if(req.body && Array.isArray(req.files.coverImage) && req.files.coverImage.length> 0){
          coverImageLocalPath = req.files.coverImage[0].path
     }
     if(!avatarloacalPath){
          throw new ApiError(400 , "avatar is required")
     }

     const avatar = await uploadOnCloudinary(avatarloacalPath)
     const coverImage = await uploadOnCloudinary(coverImageLocalPath)

     if(!avatar){
          throw new ApiError(400 , "avatar is required")
     }

     const user = await User.create({
          fullName,
          avatar : avatar.url,
          coverImage : coverImage?.url || "",
          email,
          password,
          username: username.toLowerCase()
     })

     const cretedUser = await User.findById(user._id).select("-password -refreshToken");


     if(!cretedUser){
          throw new ApiError(500, "something went wrong while creating user")
     }
     
     return res.status(200).json(
          new ApiResponse(200 , cretedUser, "User registed Successfullly " )
     )

})

const loginUser = asyncHandler( async (req , res) => {
      const {username, password , email} = req.body

      if(!username && !email){
          throw new ApiError(401, "username or email is required")
      }

        const user = await User.findOne({
          $or: [{username}, {email}]
      })
      if(!user){
          throw new ApiError(404, "user does not found ")
      }

     const isPasswordValid = await user.isPasswordCorrect(password)
     

     if(!isPasswordValid){
          throw new ApiError(404, "Invalid Password ")
      }
      
      const {accessToken, refreshToken} = await generateAccessAndRefreshToken(user._id)
      
     const loggedInUser = await User.findById(user._id).select("-refreshtoken -password")
     
     const options = {
          httpOnly: true,
          secure:true
     }
    
     res
     .status(200)
     .cookie("accessToken" , accessToken , options)
     .cookie("refreshToken" , refreshToken , options)
     .json(
          new ApiResponse(
               200,
               {
                    user: loggedInUser ,accessToken , refreshToken
               },
               "logged in successfully"
          )
     )
  
})

const logoutUser = asyncHandler(async (req , res) => {
    await User.findByIdAndUpdate(
          req.user._id,
          {
               $set:{
                     refreshToken: undefined
               }
          },
          {
               new: true
          }
     )

     const options = {
          httpOnly: true,
          secure:true
     }      
          
      return res
      .status(200)
      .clearCookie("accessToken", options)    
      .clearCookie("refreshToken", options)    
      .json(new ApiResponse(200 ,{}, "User logout successfully"))
           
          
})

const refreshaccessToken = asyncHandler(async (req , res) => {
    const incommingRefreshToken  = req.cookies.refreshToken || req.body.refreshToken

    if(!incommingRefreshToken){
     throw new ApiError(401 ,"Unauthorized request")
    }
try {
         const decodedToken = Jwt.verify(incommingRefreshToken, process.env.REFRESH_TOKEN_SECRET)
     
         const user = await User.findById(decodedToken?._id)
          
         if(!user){
          throw new ApiError(401 ,"Invalid refresh token")
         }
     
         if(incommingRefreshToken !== user?.refreshToken){
          throw new ApiError(401, "Refresh token is expired or used")
         }
     
         const options = {
          httpOnly: true,
          secure: true
         }
     
         const {accessToken , newRefreshToken} = generateAccessAndRefreshToken(user._id)
     
         res
         .status(200)
         .cookie("accessToken" , accessToken,options )
         .cookie("refreshToken" , newRefreshToken ,options)
         .json(
              new ApiResponse(
                   200,
                   {
                        accessToken, refreshToken: newRefreshToken
                   },
                   "Acess token refreshed"
              )
         )
} catch (error) {
     throw new ApiError(401, error?.message || "Invalid refresh token")
}


})

const changeCurrentPassword = asyncHandler(async (req , res) => {
      const {oldPassword , newPassword} = req.body

      const user = await  User.findById(req.user?._id) 

      const isPasswordCorrect = await user.isPasswordCorrect(oldPassword)

      if(!isPasswordCorrect){
          throw new ApiError(400 , "Invalid Password")
      }

      user.password = newPassword

     await  user.save({validateBeforeSave:false})

     return res
     .status(200)
     .json(new ApiResponse(200 , {}, "Password changed successfully")
         
     )
})

const getCurrentUser = asyncHandler(async (req , res)=> {
     return res
     .status(200)
     .json(200 , req.user, "current user fetched successfully" )

})

const updateAccountDetails = asyncHandler(async () =>{
     const {fullName , email} = req.body

     if(!fullName || !email) {
          throw new ApiError(400 , "All feilds are required")
     }

    const user = await  User.findByIdAndUpdate(req.user._id,{
          $set: {
               fullName,
               email
          }
     },{
          new: true
     }).select("-password")

     res
     .status(200)
     .json( new ApiResponse(200 , user , "Account details updated successfully"))
})

const updateUserAvtar = asyncHandler(async (req , res) => {
      const avatarloacalPath = req.file?.path

      if(!avatarloacalPath){
          throw new ApiError(400 , "Avatar file is missing ")
      }

      const avatar = await uploadOnCloudinary(avatarloacalPath)

      if(avatar.url){
          throw new ApiError(400, "Error while uploading on avatar")
      }

     const user =  await User.findByIdAndUpdate(req.user._id, {
                $set: {
                     avatar: avatar.url
                }
          },
          {
               new : true
          }
     ).select("-password")

     res
     .status(200)
     .json(new ApiResponse(200 , user , "avatar uploaded successfully"))
})

const updateUserCoverImage = asyncHandler(async (req , res) => {
     const coverImageloacalPath = req.file?.path

     if(!coverImageloacalPath){
         throw new ApiError(400 , "Cover Image file is missing ")
     }

     const coverImage = await uploadOnCloudinary(coverImageloacalPath)

     if(coverImage.url){
         throw new ApiError(400, "Error while uploading on coverImage")
     }

   const user = await User.findByIdAndUpdate(req.user._id, {
               $set: {
                    coverImage:coverImage.url
               }
          },
          {
          new : true
          }
     ).select("-password")

    res
    .status(200)
    .json(new ApiResponse(200 , user , "Cover Image uploaded successfully"))
})

const getUserChannelProfile = asyncHandler(async(req, res) => {
     const {username} = req.params;
 
     if (!username?.trim()) {
         throw new ApiError(400, "username is missing");
     }
 
     const channel = await User.aggregate([
         {
             $match: {
                 username: username?.toLowerCase()
             }
         },
         {
             $lookup: {
                 from: "subscriptions", 
                 localField: "_id", 
                 foreignField: "channel",
                 as: "subscribers" 
             }
         },
         {
             $lookup: {
                 from: "subscriptions",
                 localField: "_id",
                 foreignField: "subscriber",
                 as: "subscribedTo"
             }
         },
         {
             $addFields: {
                 subcribersCount: {
                     $size: "$subscribers"
                 },
                 channelsSubscribedToCount: {
                     $size: "$subscribedTo"
                 },
                 isSubscribed: {
                     $cond: {
                         if: {$in: [req.user?._id, "$subscribers.subscriber"]},
                         then: true,
                         else: false
                     }
                 }
             }
         },
         {
             $project: {
                 fullName: 1,
                 username: 1,
                 email: 1,
                 avatar: 1,
                 coverImage: 1,
                 subcribersCount: 1,
                 channelsSubscribedToCount: 1,
                 isSubscribed: 1
             }
         }
     ]);
 
    
     if (!channel?.length) {
         throw new ApiError(404, "channel doesnot exist");
     }
 
     return res
         .status(200)
         .json(
             new ApiResponse(
                 200,
                 channel[0],
                 "User channel fetced successfully"
             )
         )
 });

const getWatchHistory = asyncHandler(async (req , res) => {
     const user =  User.aggregate([
          {
               $match: {
                    _id: new mongoose.Types.ObjectId(req.user._id)
               }
          },
          {
               $lookup: {
                    from: "vidoes",
                    localField: 'watchHistory',
                    foreignField: '_id',
                    as: 'watchHistory',
                    pipeline: [
                         {
                              $lookup: {
                                   from: "users",
                                   localField: "owner",
                                   foreignField: "_id",
                                   as: 'owner',
                                   pipeline: [
                                        {
                                             $project: {
                                                  fullName: 1,
                                                  username: 1,
                                                  avatar: 1
                                             }
                                        }
                                   ]
                              }
                         },
                         {
                              $addFields: {
                                   $first: "$owner"                                   
                              }
                         }
                    ]                         
                    
               }
          }
     ])

     return res.status(201)
     .json(new ApiResponse(200 , user[0].watchHistory , "watch histoyfetched successfully"))
})

export {
     registerUser,
     loginUser,
     logoutUser,
     refreshaccessToken,
     changeCurrentPassword,
     getCurrentUser,
     updateAccountDetails,
     updateUserAvtar,
     updateUserCoverImage,
     getUserChannelProfile,
     getWatchHistory
}