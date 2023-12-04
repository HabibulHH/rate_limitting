docker run -p 6379:6379 -it redis/redis-stack-server:latest

http {
    # Define a limit zone named "my_limit_zone" to track requests.
    limit_req_zone $binary_remote_addr zone=my_limit_zone:10m rate=1r/s;

    server {
        listen 80;

        location /limited-resource {
            # Apply rate limiting using the "my_limit_zone" zone.
            limit_req zone=my_limit_zone;

            # Your regular configuration for handling requests to the limited resource.
            # For example:
            proxy_pass http://backend_server;
            # Other proxy configurations...

            # Optional: Customize the error response when rate limit is exceeded.
            error_page 503 @toomanyrequests;
            location @toomanyrequests {
                return 503 "Rate limit exceeded. Please try again later.";
            }
        }

        # Your other server configurations...
    }
}
