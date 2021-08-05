const mongoose = require('mongoose')
const supertest = require('supertest')
const helper = require('./test_helper')
const app = require('../app')
const api = supertest(app)
const bcrypt = require('bcrypt')
const Blog = require('../models/blog')
const User = require('../models/user')



beforeEach(async () => {
  await Blog.deleteMany({})

  for (let blog of helper.initialBlogs) {
    let blogObject = new Blog(blog)
    await blogObject.save()
  }
})

describe('when there are initially some blogs saved', () => {
  test('all blogs are returned and in correct format', async () => {
    const response = await api
      .get('/api/blogs')
      .expect(200)
      .expect('Content-Type', /application\/json/)

    expect(response.body).toHaveLength(helper.initialBlogs.length)
  })

  test('unique identifier property of the blog posts is named id', async () => {
    const blogsInDb = await helper.blogsInDb()

    for (let blog of blogsInDb) {
      expect(blog.id).toBeDefined()
    }
  })
})

describe('addition of a new blog', () => {

  beforeEach(async () => {
    await User.deleteMany({})

    const username = 'root'
    const password = 'superSecretPassword'
    const passwordHash = await bcrypt.hash(password, 10)
    const user = new User({ username, passwordHash })

    await user.save()
  })


  test('a valid blog can be added', async () => {
    const validBlog = {
      title: 'Valid blog',
      author: 'John Doe',
      url: 'http://blog.cleancoder.com/validblog.html',
      likes: 2,
    }

    const validLogin = {
      username: 'root',
      password: 'superSecretPassword',
    }

    const loginResponse = await api
      .post('/api/login')
      .send(validLogin)
      .expect(200)
      .expect('Content-Type', /application\/json/)

    const token = loginResponse.body.token

    await api
      .post('/api/blogs')
      .set('Authorization', `bearer ${token}`)
      .send(validBlog)
      .expect(201)
      .expect('Content-Type', /application\/json/)

    const blogsAtEnd = await helper.blogsInDb()
    expect(blogsAtEnd).toHaveLength(helper.initialBlogs.length + 1)

    const titles = blogsAtEnd.map(b => b.title)
    expect(titles).toContain('Valid blog')
  })


  test('a blog cannot be added if authorization is not provided', async () => {
    const validBlog = {
      title: 'Valid blog',
      author: 'John Doe',
      url: 'http://blog.cleancoder.com/validblog.html',
      likes: 2,
    }

    await api
      .post('/api/blogs')
      .send(validBlog)
      .expect(401)
      .expect('Content-Type', /application\/json/)

    const blogsAtEnd = await helper.blogsInDb()

    expect(blogsAtEnd).toHaveLength(helper.initialBlogs.length)
  })



  test('likes property will default to the value of 0 if missing in request', async () => {
    const blogWithoutLikesProperty = {
      title: 'Some blog',
      author: 'John Doe',
      url: 'http://blog.com/someblog.html'
    }

    const validLogin = {
      username: 'root',
      password: 'superSecretPassword',
    }

    const loginResponse = await api
      .post('/api/login')
      .send(validLogin)
      .expect(200)
      .expect('Content-Type', /application\/json/)

    const token = loginResponse.body.token

    await api
      .post('/api/blogs')
      .set('Authorization', `bearer ${token}`)
      .send(blogWithoutLikesProperty)
      .expect(201)
      .expect('Content-Type', /application\/json/)

    const blogsAtEnd = await helper.blogsInDb()
    expect(blogsAtEnd).toHaveLength(helper.initialBlogs.length + 1)

    const postedBlog = blogsAtEnd[blogsAtEnd.length - 1]
    expect(postedBlog.likes).toEqual(0)


  })

  test('blog without title and url is not added', async () => {
    const invalidBlog = {
      author: 'John Doe',
      url: 'http://blog.cleancoder.com/validblog.html',
      likes: 2,
    }

    const validLogin = {
      username: 'root',
      password: 'superSecretPassword',
    }

    const loginResponse = await api
      .post('/api/login')
      .send(validLogin)
      .expect(200)
      .expect('Content-Type', /application\/json/)

    const token = loginResponse.body.token

    await api
      .post('/api/blogs')
      .set('Authorization', `bearer ${token}`)
      .send(invalidBlog)
      .expect(400)
      .expect('Content-Type', /application\/json/)

    const blogsAtEnd = await helper.blogsInDb()

    expect(blogsAtEnd).toHaveLength(helper.initialBlogs.length)
  })
})


test('a specifig blog can bew viewed', async () => {
  const blogsAtStart = await helper.blogsInDb()

  const blogToView = blogsAtStart[0]

  const resultBlog = await api
    .get(`/api/blogs/${blogToView.id}`)
    .expect(200)
    .expect('Content-Type', /application\/json/)

  const processedBlogToView = JSON.parse(JSON.stringify(blogToView))

  expect(resultBlog.body).toEqual(processedBlogToView)
})

test('a specified blog can be updated', async () => {
  const blogsAtStart = await helper.blogsInDb()

  const blogToUpdate = blogsAtStart[0]

  const updated = { ...blogToUpdate, likes: blogToUpdate.likes + 1 }

  const resultBlog = await api
    .put(`/api/blogs/${blogToUpdate.id}`)
    .send(updated)
    .expect(200)

  expect(resultBlog.body.likes).toEqual(updated.likes)
})

test('a specific blog can be deleted', async () => {
  await User.deleteMany({})

  const username = 'root'
  const password = 'superSecretPassword'
  const passwordHash = await bcrypt.hash(password, 10)
  const user = new User({ username, passwordHash })

  await user.save()

  const newBlog = {
    title: 'To be removed...',
    author: 'John Doe',
    url: 'http://blog.cleancoder.com/validblog.html',
    likes: 2,
  }

  const validLogin = {
    username: 'root',
    password: 'superSecretPassword',
  }

  const loginResponse = await api
    .post('/api/login')
    .send(validLogin)
    .expect(200)
    .expect('Content-Type', /application\/json/)

  const token = loginResponse.body.token

  const postResponse = await api
    .post('/api/blogs')
    .set('Authorization', `bearer ${token}`)
    .send(newBlog)
    .expect(201)
    .expect('Content-Type', /application\/json/)

  const blogId = postResponse.body.id

  const blogsBeforeDeletion = await helper.blogsInDb()

  await api
    .delete(`/api/blogs/${blogId}`)
    .set('Authorization', `bearer ${token}`)
    .expect(204)

  const blogsAtEnd = await helper.blogsInDb()

  expect(blogsAtEnd).toHaveLength(blogsBeforeDeletion.length - 1)

  const titles = blogsAtEnd.map(b => b.title)

  expect(titles).not.toContain(newBlog.title)

})

describe('when there is initially one user in db', () => {
  beforeEach(async () => {
    await User.deleteMany({})

    const passwordHash = await bcrypt.hash('sekret', 10)
    const user = new User({ username: 'root', passwordHash })

    await user.save()
  })

  test('creation succeeds with a fresh username', async () => {
    const usersAtStart = await helper.usersInDb()

    const newUser = {
      username: 'jdoe',
      name: 'John Doe',
      password: 'pass123',
    }

    await api
      .post('/api/users')
      .send(newUser)
      .expect(200)
      .expect('Content-Type', /application\/json/)

    const usersAtEnd = await helper.usersInDb()
    expect(usersAtEnd).toHaveLength(usersAtStart.length + 1)

    const usernames = usersAtEnd.map(u => u.username)
    expect(usernames).toContain(newUser.username)
  })

  test('creation fails with proper statuscode and message if username already taken', async () => {
    const usersAtStart = await helper.usersInDb()

    const newUser = {
      username: 'root',
      name: 'Superuser',
      password: 'heslo123',
    }

    const result = await api
      .post('/api/users')
      .send(newUser)
      .expect(400)
      .expect('Content-Type', /application\/json/)

    expect(result.body.error).toContain('`username` to be unique')

    const usersAtEnd = await helper.usersInDb()
    expect(usersAtEnd).toHaveLength(usersAtStart.length)
  })

  test('creation fails with proper statuscode and message if password is missing', async () => {
    const usersAtStart = await helper.usersInDb()

    const newUser = {
      username: 'root',
      name: 'Superuser',
    }

    const result = await api
      .post('/api/users')
      .send(newUser)
      .expect(400)
      .expect('Content-Type', /application\/json/)

    expect(result.body.error).toContain('password missing')

    const usersAtEnd = await helper.usersInDb()
    expect(usersAtEnd).toHaveLength(usersAtStart.length)
  })

  test('creation fails with proper statuscode and message if username\'s length < 3', async () => {
    const usersAtStart = await helper.usersInDb()

    const newUser = {
      username: 'ro',
      name: 'Superuser',
      password: 'pass01',
    }

    const result = await api
      .post('/api/users')
      .send(newUser)
      .expect(400)
      .expect('Content-Type', /application\/json/)

    expect(result.body.error).toContain('`username` (`ro`) is shorter than the minimum allowed length')

    const usersAtEnd = await helper.usersInDb()
    expect(usersAtEnd).toHaveLength(usersAtStart.length)
  })
})



afterAll(() => {
  mongoose.connection.close()
})