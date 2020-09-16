const chai = require('chai');
const expect = chai.expect;
const url = `http://localhost:4000/`;
const request = require('supertest')(url);


const query_forAllPosts = { query: 'query {getAllPosts {code success lastEvaluatedKey post{id}}}' }
// query to get all 

const bad_request_mutation = { mutation: 'mutation {likeUnlikePost(post: {id:"random123456" likes: {employee: {id: "10"}}}) {code success message post {id likes {count employee {id}}createdBy{id}}}}' }
// bad request as key is set to mutation which is not valid 400

const error_query = { query: 'query {getPost(id:"random4446454") { code }}' }
// post for this id will not be found 404

const server_error_mutation = { query: 'mutation { upsertComment(post:{id:"any"}){code message post{id}}}' }
// server error as url for post is not defined 500

var postId = ""

describe('Queries and Mutations', async () => {
    it('Returns all posts', (done) => {
        request.post('graphql')
            .send(query_forAllPosts)
            .expect(200)
            .end((err, res) => {
                // res will contain all posts
                if (err) return done(err);
                postId = String(res.body.data.getAllPosts.post[0].id);
                expect(res.body.data.getAllPosts).to.have.property('code')
                expect(res.body.data.getAllPosts).to.have.property('success')
                expect(res.body.data.getAllPosts).to.have.property('lastEvaluatedKey')
                expect(res.body.data.getAllPosts).to.have.property('post')
                expect(res.body.data.getAllPosts.post).to.be.a("array")
                expect(res.body.data.getAllPosts.post[0].id).to.be.a("string")
                expect(res.body.data.getAllPosts.post[0]).to.not.have.property("caption")
                done();
            })
    })
    it('Returns post with expected id', (done) => {
        const get_post_query = { query: 'query {getPost(id:"' + postId + '") {code success lastEvaluatedKey post{id}}}' }
        request.post('graphql')
            .send(get_post_query)
            .expect(200)
            .end((err, res) => {
                {
                    if (err) return done(err);
                    expect(res.body.data.getPost).to.have.property('code')
                    expect(res.body.data.getPost).to.have.property('success')
                    expect(res.body.data.getPost).to.have.property('lastEvaluatedKey')
                    expect(res.body.data.getPost).to.have.property('post')
                    expect(res.body.data.getPost.post).to.be.a("array")
                    expect(res.body.data.getPost.post[0].id).to.equal(postId)
                    expect(res.body.data.getPost.post[0]).to.not.have.property("likes")
                    done();
                }
            })
    });
    it('Like a post', (done) => {
        const likeUnlike_mutation = { query: 'mutation {likeUnlikePost(post: {id:"'+postId+'" likes: {employee: {id: "10"}}}) {code success message post {id likes {count employee {id}}createdBy{id}}}}' }
        // mutation to like and unlike comment
        request.post('graphql')
            .send(likeUnlike_mutation)
            .expect(200)
            .end((err, res) => {
                // post liked response
                if (err) return done(err);
                expect(res.body.data.likeUnlikePost).to.have.property('code')
                expect(res.body.data.likeUnlikePost).to.have.property('success')
                expect(res.body.data.likeUnlikePost).to.have.property('post')
                expect(res.body.data.likeUnlikePost.post[0].likes.count).to.be.equal(1)
                done();
            })
    })
    it('Unlike a post', (done) => {
        const likeUnlike_mutation = { query: 'mutation {likeUnlikePost(post: {id:"'+postId+'" likes: {employee: {id: "10"}}}) {code success message post {id likes {count employee {id}}createdBy{id}}}}' }
        // mutation to like and unlike comment
        request.post('graphql')
            .send(likeUnlike_mutation)
            .expect(200)
            .end((err, res) => {
                // post unliked response
                if (err) return done(err);
                expect(res.body.data.likeUnlikePost).to.have.property('code')
                expect(res.body.data.likeUnlikePost).to.have.property('success')
                expect(res.body.data.likeUnlikePost).to.have.property('post')
                expect(res.body.data.likeUnlikePost.post[0].likes.count).to.be.equal(0)
                done();
            })
    })
});



describe('Bad Request', async () => {
    it('Request not readable', (done) => {
        request.post('graphql')
            .send(bad_request_mutation)
            .expect(400)
            .end((err, res) => {
                // response is error
                if (err) return done(err)
                expect(res.status).to.be.equal(400)
                done();
            })
    })
});


describe('Not found', async () => {
    it('Post of id not found', (done) => {
        request.post('graphql')
            .send(error_query)
            .expect(200)
            .end((err, res) => {
                // response is error
                if (err) return done(err)
                expect(res.body.data.getPost.code).to.be.equal(404)
                done();
            })
    })
});


describe('Server Error', async () => {
    it('Server could not process request', (done) => {
        request.post('graphql')
            .send(server_error_mutation)
            .expect(200)
            .end((err, res) => {
                // response is error
                if (err) return done(err)
                expect(res.body.data.upsertComment.code).to.be.equal(500)
                done();
            })
    })
});