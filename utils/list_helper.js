const _ = require('lodash')

// eslint-disable-next-line no-unused-vars
const dummy = (blogs) => {
  return 1
}

const totalLikes = (blogs) => blogs.reduce((sum, blog) => sum + blog.likes, 0)

const favoriteBlog = (blogs) => {
  let favorite = blogs[0]
  for (let i = 1; i < blogs.length; i++) {
    if (blogs[i].likes > favorite.likes) {
      favorite = blogs[i]
    }
  }

  return blogs.length === 0
    ?
    null
    :
    (({ title, author, likes }) => ({ title, author, likes }))(favorite)
}

const mostBlogs = (blogs) => {
  let authors = blogs.map(blog => blog.author)
  let countedAuthors = _.countBy(authors)
  let authorWithMostBlogs = _.maxBy(_.keys(countedAuthors), function (o) { return countedAuthors[o] })

  return blogs.length === 0
    ?
    null
    :
    { author: authorWithMostBlogs, blogs: countedAuthors[authorWithMostBlogs] }
}

const mostLikes = (blogs) => {

  let authorsByLikes = blogs.reduce((accumulator, { author, likes }) => {
    accumulator[author] = accumulator[author] || 0 //without this line accumulator[author] would be undefined and therefore it woulnt be possible to incerement it
    accumulator[author] += likes
    return accumulator
  }, {})

  let authorWithMostLikes = _.maxBy(Object.keys(authorsByLikes), o => authorsByLikes[o])

  return blogs.length === 0
    ?
    null
    :
    { author: authorWithMostLikes, likes: authorsByLikes[authorWithMostLikes] }

}


module.exports = {
  dummy,
  totalLikes,
  favoriteBlog,
  mostBlogs,
  mostLikes
}

