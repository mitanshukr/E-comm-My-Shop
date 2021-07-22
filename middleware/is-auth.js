module.exports = (req, res, next) => {
    if(!req.session.user){
        return res.redirect('/login');
    }
    next();
};

/*
Remember:-

your url:- http://example.com/something/xyz
console.log(req.protocol);  //http
console.log(req.get('host'));   //example.com
console.log(req.originalUrl);   ///something/xyz
console.log(req.url);   ///xyz
*/