# GraphQL Application

This is a graphQl Apllication where we can create a post with a picture, like or unlike the post, can add/edit/remove a comment from the post.

## Installation

To run the app, follow the below steps:

1. If you have local dynamoDB installed in your system, Run the server using
    ```shell
     java -Djava.library.path=./DynamoDBLocal_lib -jar DynamoDBLocal.jar -sharedDb
    ```
    ->If you want to run on different port mention the port number in endpoint of file
        `src -> utils -> DynamoDBCLient.js`
    and run the command with same port number <br/>for example if the mentioned port is 9000, then use the bellow command
    ```shell
        java -Djava.library.path=./DynamoDBLocal_lib -jar DynamoDBLocal.jar -sharedDb -port 9000
    ```
    -> To run dynamoDB locally in `LINUX` system, check the following link
    ```shell
        https://garywoodfine.com/how-to-install-dynamodb-on-local-ubuntu-development/
    ```

2. If you do not have dynamodb setup locally then follow these step to setup<br/>
    i. Install AWS CLI from link: 
    ```shell
        https://docs.aws.amazon.com/cli/latest/userguide/cli-chap-install.html
    ```
    ii. Check if AWS CLI is installed in your system with the following commands
    ```shell
        aws --version    (or)    /usr/local/bin/aws --version
    ```
    iii. Configure AWS using `aws configure` command from CMD. <br/>Give any key, id, aws region(available in the below document) and output as json<br/>
    iv. Download dynamodb local and follow the steps given here to start dynamodb locally-<br/>
    ```shell
        https://docs.aws.amazon.com/amazondynamodb/latest/developerguide/DynamoDBLocal.DownloadingAndRunning.html
    ```
    v. After setting up db and running jar file, you should be able to view the dynamodb shell on
    ```shell
        http://localhost:8000/shell
    ```
    vi. Paste the below code in editor and click `run`(play button)<br/>
    ```shell
                var params = {
                TableName: 'post',
                KeySchema: [ 
                    { 
                        AttributeName: 'id',
                        KeyType: 'HASH',
                    }
                ],
                AttributeDefinitions: [ 
                    {
                        AttributeName: 'id',
                        AttributeType: 'S', 
                    }
                ],
                ProvisionedThroughput: { 
                    ReadCapacityUnits: 1, 
                    WriteCapacityUnits: 1, 
                }
                };
                dynamodb.createTable(params, function(err, data) {
                    if (err) ppJson(err); 
                    else ppJson(data); 
                });
    ```

3. Now you have to create an s3 bucket in aws console<br/>
    i.   Login or signup to aws console<br/>
    ii.  search for  `s3` in services<br/>
    iii. create an s3 bucket with the unique name and a specific region<br/>
    iv.  Goto `My Security Credentials` which is in dropdown of your username<br/>
    v.   click on `access keys` and generate a new key and download the rootkey file
4. Add the credentials to the credentials file. Goto path
    ```shell
        C:\Users\userid\.aws\credentials
    ```
    and add the credentials in the following manner
    ```shell
        [default]
        aws_access_key_id = fakeId
        aws_secret_access_key = fakeKey
        [awss3]
        aws_access_key_id = ----key id prsent in downloaded file-----
        aws_secret_access_key = ----access key--------
    ```
5. Go to `package.json` in graphql application and replace ``photoposting`` in line number 20 with `YOUR S3 BUCKET NAME`
6. To run the graphql server run the below commands in the project folder
    ```bash
        npm install
    ```

    and 

    ```bash
        npm start
    ```


# Using postmanclient collection

1. To run the APIs, import the postmanclient collection from the below link `You need recent version of postman client to be installed in your system i.e ^7.2`<br/>

    Note: To import the collection in postman client Goto <br/>
        Import(on top left of postmanclient) -> link <br/>
        paste the below url and click `continue`. you should be able to see the collection named `fitness app` in collections tab on the left.

    ```shell
        https://www.getpostman.com/collections/2cc8f71c1d9b222d0df6 
    ```
    i. Post a picture: <br/>
        You should be able to see 3 key value pairs in `body->form data`... <br/>
    ```shell
            i. For value of operations: You can change the creator id
            ii.For picture : Add a picture(`of size less than 3MB`) from local system
    ```
        Response : you will get a response as below
    ```shell
            {
                "data": {
                    "createPost": {
                        "code": 201,
                        "success": true,
                        "message": "Post uploaded successfully",
                        "post": [
                            {
                                "id": "700aa3d7-c8f3-487b-bb4e-1672fb762074",
                                "url": "https://my1bucket2.s3.ap-south-1.amazonaws.com/uploads/1001/pic5.jpg"
                            }]}}}
    ```
    ii. Get post by id:<br/>
        You should be able to see a query in `body -> graphql`...Add the previous post->id which you have got as a response for posting a picture.<br/>
        Response : you will be getting a post object with all the details<br/>
    iii. Like or unlike a post:<br/>
        You should be able to see a query in `body -> graphql`...Add the previous post->id which you have got as a response for posting a picture.<br/>
        Response : you will get a response as below  and if you hit for same post id twice it is trated as unlike and gets removed from likes
    ```shell
            {
                "data": {
                    "likeUnlikePost": {
                        "code": 200,
                        "success": true,
                        "message": "Post liked/unliked",
                        "post": [
                            {
                                "id": "27e365cb-caa4-47d0-9c6d-67357aa25a4d",
                                "likes": {
                                    "count": 1,
                                    "employee": [
                                        {
                                            "id": "10002"
                                        }]}}]}}}
    ```
    iv. Add comment to a post:<br/>
    You should be able to see a query in `body -> graphql`...Add the previous post->id which you have got as a response for posting a picture.<br/>
        Response : you will get a response as below
    ```shell
            {
                "data": {
                    "upsertComment": {
                        "code": 200,
                        "success": true,
                        "message": "Comment saved successfully ",
                        "post": [
                            {
                                "id": "27e365cb-caa4-47d0-9c6d-67357aa25a4d",
                                "comments": [
                                    {
                                        "id": "829d7f08-09bc-4590-90d8-4740bddc09be",
                                        "commentStatement": "!",
                                        "commentBy": {
                                        "firstName": "shravyaa"
                                        }}]}]}}}
    ```
    v.Get all posts with id:<br/>
    You should be able to see a query in `body -> graphql`...<br/>
        Response : you will get all the ids of posted pictures<br/>
    vi.Remove a comment:<br/>
    You should be able to see a query in `body -> graphql`...Add the previous post->id which you have got as a response for posting a picture and the comment->id which you have got after adding the comment.<br/>
        Response : you will get the response like this
    ```shell
            {
                "data": {
                    "removeComment": {
                        "code": 200,
                        "success": true,
                        "message": "Comment removed successfully",
                        "post": [
                            {
                                "comments": []
                            }]}}}
    ```
    vii. Remove a Post: <br/>
    You should be able to see a query in `body -> graphql`...Add the creatorid(if changed in posting a picture) and in the place of 1009 in `uploads/1009/gym.jpg` mention the id of the creator of post and mention the name of the file.
        Response: you will get the response like this
    ```shell
                {
                    "data": {
                        "removePost": {
                            "code": 200,
                            "success": true,
                            "message": "Post deleted successfully"
                        }}}
    ```
    viii. Get all posts with all details:<br/>
    You should be able to see a query in `body -> graphql`...<br/>
    Response : you will get all the details of posted pictures<br/>

## Running tests
```bash
        npm test
    ```