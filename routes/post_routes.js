const express = require('express');
const post = require('../models/post');
const auth = require('../middleware/auth');

const post_router = express.Router();

post_router.get('/posts', auth, async (req, res) => {
    const sort = {}
    if (req.query.sortBy) {
        const query_parts = req.query.sortBy.split(':')
        sort[query_parts[0]] = query_parts[1] === 'desc' ? -1 : 1
    }
    try {
        await req.user.populate({
            path: 'posts',
            options: {
                limit: parseInt(req.query.limit),
                skip: parseInt(req.query.skip),
                sort
            }
        }).execPopulate()
        res.send(req.user.posts)
    } catch (e) {
        res.status(500).send()
    }
})

post_router.get('/posts/:id', auth, async (req, res) => {
    const post_id = req.params.id
    try {
        const my_post = await post.findOne({
            post_id,
            owner: req.user._id
        })
        res.send(my_post)
    } catch (e) {
        res.status(500).send()
    }
})

post_router.post('/posts', auth, async (req, res) => {
    const new_post = new post({
        ...req.body,
        owner: req.user._id
    })
    try {
        await new_post.save()
        res.send(new_post)
    } catch (e) {
        return console.log(e)
    }
})

post_router.patch('/posts/:id', auth, async (req, res) => {
    const updates = Object.keys(req.body)
    const valid_updates = ['title', 'description']
    const is_valid_update = updates.every((update) => valid_updates.includes(update))
    if (!is_valid_update) {
        return res.status(400).send({
            error: 'Invalid Update'
        })
    }
    try {
        const updated_post = post.findOne({
            _id: req.params.id,
            owner: req.user._id
        })
        if (!updated_post) {
            return res.status(404).send()
        }
        updates.forEach((update) => updated_post[update] = req.body[update])
        await updated_post.save()
        res.send(updated_post)
    } catch (e) {
        res.status(400).send(e)
    }
})

post_router.delete('/posts/:id', auth, async (req, res) => {
    try {
        const deleted_post = await post.findOneAndDelete({
            _id: req.params.id,
            owner: req.user._id
        })
        if (!deleted_post) {
            return res.status(404).send()
        }
        res.send(deleted_post)
    } catch (e) {
        console.log(e)
        res.status(500).send()
    }
})

module.exports = post_router