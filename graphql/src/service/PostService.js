const dynamodbClient = require('../utils/DynamoDBClient');
const PostRepository = require('../repository/PostRepository');
const logger = require('../utils/LogUtils');
const { v4 } = require('uuid');
const AWS = require('aws-sdk');
AWS.profile = 'awss3';
// The name of the S3 bucket
const BUCKET_NAME = process.argv[2];
const credentials = new AWS.SharedIniFileCredentials({ profile: 'awss3' });
AWS.config.credentials = credentials;
const s3 = new AWS.S3();

class PostService {
    constructor() {
        this.postRepository = new PostRepository(dynamodbClient);
        this.getPost = this.getPost.bind(this);
        this.getAllPosts = this.getAllPosts.bind(this);
        this.createPost = this.createPost.bind(this);
        this.removePost = this.removePost.bind(this);
        this.likeUnlikePost = this.likeUnlikePost.bind(this);
        this.upsertComment = this.upsertComment.bind(this);
        this.removeComment = this.removeComment.bind(this);
    }
    async getPost(id) {
        try {
            ;
            logger.debug('Request received to fetch post details for id: ' + id);
            const postDetails = [];
            const post = await this.postRepository.get(id);
            logger.debug('Retrieved post details');
            if (post) {
                postDetails.push(post);
            }
            else {
                ;
                return {
                    code: 404,
                    success: false,
                    message: "Post not found",
                    post: postDetails
                }
            }

            return {
                code: 200,
                success: true,
                message: "Post fetched successfully",
                post: postDetails
            }
        }
        catch (error) {
            logger.error('Error while fetching post:: ' + error);
            return {
                code: 500,
                success: false,
                message: `Error while fetching post:  ${error.message ? error.message : ""}`,
                post: null
            }
        }
    }
    async getAllPosts(pageSize, lastItem) {
        try {
            let post;
            logger.debug('Request received to fetch all posts');
            post = await this.postRepository.scan(pageSize, lastItem);
            logger.debug('Retrieved all posts from db');
            return {
                code: 200,
                success: true,
                message: "Post fetched successfully",
                lastEvaluatedKey: post.LastEvaluatedKey ? post.LastEvaluatedKey.id : post.LastEvaluatedKey,
                post: post.Items
            }
        }
        catch (error) {
            logger.error('Error while fetching post::' + error);
            return {
                code: 500,
                success: false,
                message: `Error while fetching posts:  ${error.message ? error.message : ""}`,
                post: null
            }
        }
    }
    async createPost(post) {
        const { filename, createReadStream } = await post.file;
        const { caption, createdBy } = post;
        try {

            logger.debug('Request received to upload post');
            const readStream = createReadStream();
            let post;
            let postResponse = [];
            // Setting up S3 upload parameters
            const params = {
                Bucket: BUCKET_NAME,
                Key: `uploads/${createdBy.id}/${filename}`,
                Body: readStream,
                ACL: 'public-read'
            };

            // Uploading files to the bucket
            const fileUploadResponse = await s3.upload(params).promise();
            logger.debug('Uploaded post to S3 bucket');
            if (fileUploadResponse) {
                post = {
                    id: v4(),
                    url: fileUploadResponse.Location,
                    key: fileUploadResponse.Key,
                    caption,
                    likes: { count: 0 },
                    comments: [],
                    createdDate: new Date().toISOString(),
                    createdBy
                }
                logger.debug('Inserting post details to db with post id:: ' + post.id);
                await this.postRepository.put(post);
                postResponse.push(post);
                logger.debug('Inserted post details to db with post id:: ' + post.id);
            }
            ;
            return {
                code: 201,
                success: true,
                message: 'Post uploaded successfully',
                post: postResponse
            }
        }
        catch (error) {
            logger.error('Error while uploading post: ' + error)
            return {
                code: 500,
                success: false,
                message: `Post upload failed:  ${error.message ? error.message : ""}`,
                post: null
            }
        }
    }
    async removePost(postId, filename) {
        try {
            logger.debug('Request received to delete post details from db with post id:: ' + postId);
            await this.postRepository.delete({ id: postId });
            logger.debug('Post details deleted from db');
            logger.debug('Deleting photo from S3 bucket');
            const deleteResponse = await s3.deleteObject({
                Bucket: BUCKET_NAME,
                Key: filename
            }).promise();
            logger.debug('Photo deleted from S3 bucket::', filename);
            ;
            if (deleteResponse) {
                return {
                    code: 200,
                    success: true,
                    message: 'Post deleted successfully'
                };
            }
        }
        catch (error) {
            logger.error('Error while deleting post:: ' + error);
            return {
                code: 500,
                success: false,
                message: `Post deletion failed:  ${error.message ? error.message : ""}`,
            };
        }
    }
    async likeUnlikePost(post) {
        let filteredResponse, putResponse;
        try {
            ;
            logger.debug('Request received to like/unlike post');
            let postResponse = [];
            let getResponse = await this.postRepository.get({ id: post.id });
            if (getResponse && post && post.likes) {
                getResponse.likes = getResponse.likes ? getResponse.likes : {};
                getResponse.likes.count = getResponse.likes.count ? getResponse.likes.count : 0;
                if (!getResponse.likes.employee) {
                    getResponse.likes.employee = [];
                }
                filteredResponse = getResponse.likes.employee.filter((obj) => obj.id === post.likes.employee.id);
                if (filteredResponse && filteredResponse.length > 0) {
                    getResponse.likes.count = getResponse.likes.count - 1;
                    getResponse.likes.employee = getResponse.likes.employee.filter((obj) => obj.id !== post.likes.employee.id);
                }
                else {
                    getResponse.likes.count = getResponse.likes.count + 1;
                    getResponse.likes.employee.push(post.likes.employee);
                }
            }
            postResponse.push(getResponse);
            logger.debug('Saving like/unlike preference to db');
            putResponse = await this.postRepository.update(getResponse, 'likes');
            logger.debug('like/unlike preference saved to db');
            if (putResponse) {
                return {
                    code: 200,
                    success: true,
                    message: 'Post liked/unliked',
                    post: postResponse
                };
            }
        }
        catch (error) {
            logger.error('Error while saving like:: ' + error);
            return {
                code: 500,
                success: false,
                message: `Could not save your like. Please try again:  ${error.message ? error.message : ""}`,
                post: null
            };
        }
    }
    async upsertComment(post) {
        try {
            ;
            logger.debug('Request received to upsert comments for post id:: ' + post.id);
            let postResponse = [];
            let getResponse = await this.postRepository.get({ id: post.id });
            let filteredResponse = getResponse.comments ? getResponse.comments.find((comment) => {
                if (comment.id === post.comment.id) {
                    comment.commentStatement = post.comment.commentStatement;
                    comment.createdDate = new Date().toISOString();
                    return comment;
                }
            }) : null;
            if (!filteredResponse) {
                const commentId = v4();
                post.comment.id = commentId;
                post.comment.createdDate = new Date().toISOString();
                if (post.comment) {
                    if (getResponse.comments) {
                        getResponse.comments.push(post.comment)
                    }
                    else {
                        getResponse.comments = [];
                        getResponse.comments.push(post.comment);
                    }
                }
            }
            postResponse.push(getResponse);
            logger.debug('Saving user comments to db');
            let putResponse = await this.postRepository.update(getResponse, 'comments');
            logger.debug('Successfully saved user comments to db');
            if (putResponse) {
                return {
                    code: 200,
                    success: true,
                    message: 'Comment saved successfully ',
                    post: postResponse
                };
            }
        }
        catch (error) {
            logger.error('Error while saving comment:: ' + error);
            return {
                code: 500,
                success: false,
                message: `Error while saving comment. Please try again:  ${error.message ? error.message : ""}`,
                post: null
            };
        }
    }
    async removeComment(post) {
        try {
            ;
            logger.debug('Request received to remove comments for post id:: ' + post.id);
            let filteredResponse;
            let postResponse = [];
            let getResponse = await this.postRepository.get({ id: post.id });
            if (post && post.comment) {
                filteredResponse = getResponse.comments.filter((comment) => comment.id !== post.comment.id);
            }
            getResponse.comments = filteredResponse;
            logger.debug('Removing comments from a post');
            let putResponse = await this.postRepository.update(getResponse, 'comments');
            logger.debug('Removed comments from the post');
            postResponse.push(getResponse);
            if (putResponse) {
                return {
                    code: 200,
                    success: true,
                    message: 'Comment removed successfully',
                    post: postResponse
                };
            }
        }
        catch (error) {
            logger.error('Error while removing comment:: ' + error);
            return {
                code: 500,
                success: false,
                message: `Error while removing comment. Please try again:  ${error.message ? error.message : ""}`,
                post: null
            };
        }
    }
}

module.exports = PostService;