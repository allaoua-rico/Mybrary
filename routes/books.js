const express = require('express');
const Author = require('../models/author');
const router = express.Router();
const Book= require('../models/book');
const multer=require('multer');
const path= require('path');
const fs= require('fs')
const uploadPath= path.join('public',Book.coverImageBasePath);
const imageMimeTypes=['image/jpeg','image/png',' image/gif'];
const upload= multer({
    dest:uploadPath,
    fileFliter:(req, file, callback)=>{ 
        calllback(null, imageMimeTypes.includes(file.mimetype))
    }
})


router.get('/', async (req,res) => {
    let query= Book.find();
    if(req.query.title!=null && req.query.title!="") {
        query=query.regex('title', new RegExp(query.query.title,'i'));
    }
    if(req.query.publishedBefore!=null && req.query.publishedBefore!="") {
        query=query.lte('publishDate',req.query.publishedBefore)
    }
    if(req.query.publishedAfter!=null && req.query.publishedAfter!="") {
        query=query.gte('publishDate',req.query.publishedAfter)

    }
   try{
    const books= await query.exec();
    res.render('books/index',{
        books:books,
        searchOptions: req.query
    })
   }catch{
    res.redirect('/')
   }
});
router.get('/new',  async (req,res) => {
  renderNewImage(res, new Book() );
});
router.post('/', upload.single('cover'), async (req,res) => {
    const fileName= req.file !=null ? req.file.filename: null; 
    const book= new Book({
        title:req.body.title,
        author:req.body.author,
        publishDate: new Date(req.body.publishDate),
        pageCount:parseInt(req.body.pageCount),
        description:req.body.description,
        coverImageName:fileName
    })
    try{
        const newBook= await book.save();
        //res.redirect(`books/${newBook.id`)
        res.redirect('books')
    }catch{
        
        if(book.coverImageName!=null ) removeBookCover(book.coverImageName)
        renderNewImage(res, book, true)
    }
});

async function renderNewImage(res, book,hasError=false){
    try{
        const authors = await Author.find({});
        const params={
            authors:authors,
            book:book
        };
        if (hasError) params.errorMessage='Error creating book';

        res.render('books/new',params)
    }catch{
        res.redirect('books/')
    }
}
 function removeBookCover(fileName){
     fs.unlink(path.join(uploadPath, fileName), err=>{
        if(err) console.error(err)
     })
 }

module.exports= router;