const express = require('express');
const Author = require('../models/author');
const router = express.Router();
const Book= require('../models/book');
const imageMimeTypes=['image/jpeg','image/png',' image/gif'];


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
  renderFormImage(res,new Book(),'new', false );
});
router.post('/',  async (req,res) => {
    const book= new Book({
        title:req.body.title,
        author:req.body.author,
        publishDate: new Date(req.body.publishDate),
        pageCount:parseInt(req.body.pageCount),
        description:req.body.description
    });
    saveCover(book, req.body.cover);
    try{
        const newBook= await book.save();
        //res.redirect(`books/${newBook.id`)
        res.redirect('books')
    }catch{
        renderFormImage(res, book,'new', true)
    }
});
router.get('/:id', async (req, res)=>{
    try{
        const book= await Book.findById(req.params.id).
                                populate('author').
                                exec();
        res.render('books/show',{book:book})
    }catch{
        res.render('/')
    }
})

router.get('/:id/edit',  async (req,res) => {
    try{
        const book= await Book.findById(req.params.id)
        renderFormImage(res, book,'edit', false );
    }catch {
        res.redirect('/')
    }
  });
router.put('/:id', async (req, res)=> {
    let book;
    console.log(req.params.id)
    try{
        book= await Book.findById(req.params.id);
        book.author=req.body.author;
        book.pageCount=req.body.pageCount;
        book.publishDate=new Date(req.body.publishDate);
        book.title=req.body.title;
        book.description=req.body.description;
        if (req.body.cover!=null && req.body.cover!==""){
            saveCover(book, req.body.cover);
        }
        await book.save();
        res.redirect(`/books/${book.id}`)
    }catch(err){
        console.log(err)
        if (book != null) {
            renderFormImage(res, book, 'edit', true)
        }
        else{
            res.redirect('/')
            
        }
    }
  });
router.delete('/:id', async (req,res)=>{
    let book;
    try{
        book= await Book.findById(req.params.id);
        await book.remove();
        res.redirect('/')
    }catch{
        if(book!= null){
            res.render('books/show',{
                book:book,
                errorMessage:'error removing the book'
            })
        }
        else{
            res.redirect('/')
        }
    }
})
async function renderFormImage(res, book, form ,hasError=false){
    try{
        const authors = await Author.find({});
        const params={
            authors:authors,
            book:book
        };
        if (hasError) params.errorMessage='Error creating book';

        res.render(`books/${form}`,params)
    }catch{
        res.redirect('books/')
    }
}
function saveCover(book, coverEncoded) {
    if (coverEncoded == null) return
    const cover = JSON.parse(coverEncoded)
    if (cover != null && imageMimeTypes.includes(cover.type)) {
      book.coverImage = new Buffer.from(cover.data, 'base64')
      book.coverImageType = cover.type
    }
  }
module.exports= router;