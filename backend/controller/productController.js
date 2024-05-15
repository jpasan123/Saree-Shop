const ErrorHandler = require("../errorHandler/errorHandler");
const catchAsyncError = require("../middleWares/catchAsyncError");
const  schema  = require("../models/productModel")
const APIFeatures = require('../util/apiFeatures')

//Get all product - /api/v1/products
exports.getProducts=async(req,res,next)=>{
    let resPerPage = 8
    if(("keyword" in req.query)){
        resPerPage = 2
    }
    let buildQuery=()=>{
        return new APIFeatures(schema.find(),req.query).search().filter()
    }
    const filterProduct=await buildQuery().query
    const filterProductsCount=filterProduct.length
    const totalProduct= await schema.find().count()
    const products = await buildQuery().paginate(resPerPage).query;
    res.status(200).json({
        success:true,
        count:filterProductsCount,
        resPerPage,
        products
    })
}

//Add new product - /api/v1/products/new
exports.newProduct = catchAsyncError(async(req,res,next)=>{
    let images = []
    let BASE_URL=process.env.BACKENED_URL
    if(process.env.NODE_ENV==="production"){
        BASE_URL=`${req.protocol}://${req.get('host')}`
    }
    if(req.files.length>0){
        req.files.forEach(file=>{
            let url=`${BASE_URL}/uploads/product/${file.originalname}`
            images.push({image: url})
        })
    }
    console.log(req.body)
    
    req.body.images=images
    req.body.user=req.user.id

    const product = await schema.create(req.body);
    res.status(201).json({
        success:true,
        product
    })
})

//Get Single product - /api/v1/:id
exports.getSingleProduct = async(req,res,next)=>{
    const product=await schema.findById(req.params.id).populate('reviews.user','name email').catch(err=>{ next(new ErrorHandler(err,400))})
    if(!product){
        return next(new ErrorHandler("No Product found",401))
    }
    else{
        res.status(201).json({
            success:true,
            product
        })
    }
}

//Update product - /api/v1/:id
exports.updateProduct = async(req,res,next)=>{
    
    let product=await schema.findById(req.params.id).catch(err=>{ next(new ErrorHandler(err,400))})
    console.log(product)
    if(!product){
        return next(new ErrorHandler("No Product found",401))

    }
    
    else{
        let images = []

        //to get the images which is already exist
        if(req.body.imagesCleared==="false"){
            images=product.images
        }
        let BASE_URL=process.env.BACKENED_URL
        if(process.env.NODE_ENV==="production"){
            BASE_URL=`${req.protocol}://${req.get('host')}`
        }
        if(req.files && req.files.length>0){
            req.files.forEach(file=>{
                let url=`${BASE_URL}/uploads/product/${file.originalname}`
                images.push({image: url})
            })
        }
        req.body.images=images
        product=await schema.findByIdAndUpdate(req.params.id,req.body,{
            new:true,
            runValidators:true
        });
        res.status(201).json({
            success:true,
            product
        })
    }
}

//Delete product - /api/v1/:id
exports.deleteProduct = async(req,res,next)=>{
    let product=await schema.findById(req.params.id).catch(err=>{ next(new ErrorHandler(err,400))})
    if(!product){
        return next(new ErrorHandler("No Product found",401))

    }
    
    await schema.findByIdAndDelete(req.params.id)
    res.status(200).json({
        success:true,
        message:"deleted"
    })
    
}

//Create Review - api/v1/review
exports.createReview = catchAsyncError(async(req,res,next)=>{
    const {productId,rating,comment}=req.body;
    
    const review = {
        user : req.user.id,
        rating,
        comment
    }
    let product= await schema.findById(productId);
    const isReviewed = product.reviews.find(review=>{
        return review.user.toString() == req.user.id.toString()
    })
    //finding user review exist
    if(isReviewed){
        //updating the review
        product.reviews.forEach(review=>{
            if(review.user.toString()==req.user.id.toString()){
                review.comment = comment
                review.rating = rating
            }
        })

    }
    else{
        //creating  a review
        product.reviews.push(review)
        product.numberOfReviews=product.reviews.length
    }
    //find the avg of Product reviews
    product.rating = product.reviews.reduce((acc,review)=>{
        return review.rating+acc;
    },0)/product.reviews.length;
    
    product.rating=isNaN(product.rating)?0:product.rating;
    product=await schema.findByIdAndUpdate(productId,product,{
        new:true,
        runValidators:true
    });
    res.status(201).json({
        success:true,
        product
    })

})

//Get Reviews - api/v1/reviews
exports.getReviews = catchAsyncError(async(req,res,next)=>{
    const product= await schema.findById(req.query.id).populate('reviews.user','name email').catch(err=>{ next(new ErrorHandler(err,400))});

    res.status(200).json({
        success:true,
        reviews:product.reviews
    })

})

//Delete Reviews - api/v1/review
exports.deleteReview = catchAsyncError(async (req, res, next) => {
    try {
        // Validate request parameters
        if (!req.query.productId || !req.query.id) {
            return res.status(400).json({ error: 'productId and id are required in the query parameters' });
        }

        // Check if req.query.productId and req.query.id are valid ObjectId strings
        if (!ObjectId.isValid(req.query.productId) || !ObjectId.isValid(req.query.id)) {
            return res.status(400).json({ error: 'Invalid ObjectId in query parameters' });
        }
        // Check if req.query.id is provided and is a string
        if (!req.query.id || typeof req.query.id !== 'string') {
            return res.status(400).json({ error: 'Invalid or missing review ID in query parameters' });
        }

        // Check if req.query.id is a valid ObjectId
        if (!ObjectId.isValid(req.query.id)) {
            return res.status(400).json({ error: 'Invalid review ID format' });
        }
        // Find the product by productId
        const product = await schema.findById(req.query.productId);

        // Check if product exists
        if (!product) {
            return res.status(404).json({ error: 'Product not found' });
        }

        // Filter reviews that do not match the delete id
        const reviews = product.reviews.filter(review => review._id.toString() !== req.query.id.toString());

        // Calculate the number of reviews
        const numberOfReviews = reviews.length;

        // Calculate the average rating of the product
        let rating = 0;
        if (numberOfReviews > 0) {
            rating = reviews.reduce((acc, review) => acc + review.rating, 0) / numberOfReviews;
        }

        // Update the product with the filtered reviews, number of reviews, and average rating
        const updatedProduct = await schema.findByIdAndUpdate(
            req.query.productId,
            { rating, reviews, numberOfReviews },
            { new: true, runValidators: true }
        );

        // Return the updated reviews of the product
        res.status(200).json({
            success: true,
            reviews: updatedProduct.reviews
        });
    } catch (error) {
        next(error); // Pass the error to the error handling middleware
    }
});
//get admin products - api/v1/admin/products

exports.getAdminProducts = catchAsyncError(async(req,res,next)=>{
    const products = await schema.find()
    res.status(200).send({
        success:true,
        products
    })
})

