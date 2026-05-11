# Auth And User Use Cases

This document summarizes the implemented auth and user flows in `src/api/auth` and `src/api/user`.

Routing note: `src/api/app.router.ts` mounts health check, user, and auth routers under `/api/v1`.

## Auth Use Cases

### Sign Up

- Route: `POST /api/v1/auth/sign-up`
- Validation: `signUpRequestSchema`
- Rate limit: route scoped, limit `5`
- Input: `email`, `password`, optional `firstName`, `lastName`, `imageUrl`
- Main flow:
  1. Validate request body.
  2. Check whether a user with the email already exists.
  3. Load the default `user` role.
  4. Hash password with bcrypt.
  5. Create user with the default `user` role in a database transaction.
  6. Generate and store an activation OTP in Redis for 5 minutes.
  7. Send activation email.
  8. Return `201 Created`.
- Errors:
  - `User already exists` if email is already registered.
  - `Role not found` if the default `user` role is missing.

```plantuml
@startuml
title Auth - Sign Up

actor Client
participant "authRouter" as Router
participant "validator" as Validator
participant "rateLimit" as RateLimit
participant "AuthController" as Controller
participant "AuthService" as Service
database "MySQL" as DB
database "Redis" as Redis
participant "Nodemailer" as Mailer

Client -> Router: POST /api/v1/auth/sign-up
Router -> Validator: validate body
Validator --> Router: valid DTO
Router -> RateLimit: consume route limit
RateLimit --> Router: allowed
Router -> Controller: signUp(req)
Controller -> Service: signUp(dto)
Service -> DB: find user by email
alt user exists
    Service --> Controller: BadRequestError
else new user
    Service -> DB: find default user role
    alt role missing
        Service --> Controller: BadRequestError
    else role found
        Service -> Service: hash password
        Service -> DB: transaction create user
        Service -> Redis: set activation OTP (5 minutes)
        Service -> Mailer: send activation email
        Service --> Controller: success
        Controller --> Client: 201 Created
    end
end

@enduml
```

### Login

- Route: `POST /api/v1/auth/login`
- Validation: `loginRequestSchema`
- Rate limit: route scoped, limit `10`
- Input: `email`, `password`
- Main flow:
  1. Validate request body.
  2. Find user by email.
  3. Reject inactive users.
  4. Check Redis blocked-login key.
  5. Compare password with bcrypt.
  6. Return access and refresh tokens.
- Errors:
  - `Invalid credentials` if email or password is invalid.
  - `User not active` if the account is not activated.
  - `User blocked for 5 minutes` after too many failed password attempts.

```plantuml
@startuml
title Auth - Login

actor Client
participant "authRouter" as Router
participant "validator" as Validator
participant "rateLimit" as RateLimit
participant "AuthController" as Controller
participant "AuthService" as Service
database "MySQL" as DB
database "Redis" as Redis
participant "bcrypt" as Bcrypt
participant "JWT" as JWT

Client -> Router: POST /api/v1/auth/login
Router -> Validator: validate body
Validator --> Router: valid DTO
Router -> RateLimit: consume route limit
RateLimit --> Router: allowed
Router -> Controller: login(req)
Controller -> Service: login(dto)
Service -> DB: find user by email
alt user missing
    Service --> Controller: UnauthorizedError
else user inactive
    Service --> Controller: UnauthorizedError
else user active
    Service -> Redis: get login blocked key
    alt blocked
        Service --> Controller: UnauthorizedError
    else not blocked
        Service -> Bcrypt: compare password
        alt password invalid
            Service -> Redis: increment failed attempts
            Service --> Controller: UnauthorizedError
        else password valid
            Service -> JWT: generate access and refresh tokens
            Service --> Controller: tokens
            Controller --> Client: 200 OK
        end
    end
end

@enduml
```

### Activate Account

- Route: `POST /api/v1/auth/activate-account`
- Validation: `activateAccountRequestSchema`
- Rate limit: route scoped, limit `5`
- Input: `email`, `otp` as a number
- Main flow:
  1. Validate request body.
  2. Read activation OTP from Redis by email.
  3. Compare submitted OTP.
  4. Update `users.isActive` to `true` in a database transaction.
  5. Delete the Redis OTP key.
  6. Return `200 OK`.
- Errors:
  - `OTP failed` if OTP is missing, expired, or does not match.

```plantuml
@startuml
title Auth - Activate Account

actor Client
participant "authRouter" as Router
participant "validator" as Validator
participant "rateLimit" as RateLimit
participant "AuthController" as Controller
participant "AuthService" as Service
database "Redis" as Redis
database "MySQL" as DB

Client -> Router: POST /api/v1/auth/activate-account
Router -> Validator: validate body
Validator --> Router: valid DTO
Router -> RateLimit: consume route limit
RateLimit --> Router: allowed
Router -> Controller: activateAccount(req)
Controller -> Service: activateAccount(dto)
Service -> Redis: get auth:otp:activate:{email}
alt OTP missing or mismatch
    Service --> Controller: UnauthorizedError
else OTP matches
    Service -> DB: transaction update user isActive=true
    Service -> Redis: delete OTP key
    Service --> Controller: success
    Controller --> Client: 200 OK
end

@enduml
```

### Logout

- Route: `POST /api/v1/auth/logout`
- Authentication: refresh token
- Main flow:
  1. Authenticate refresh token.
  2. Store the refresh token in Redis logout blacklist until refresh-token expiry.
  3. Return success response.

```plantuml
@startuml
title Auth - Logout

actor Client
participant "authRouter" as Router
participant "authenticator(refresh)" as Authenticator
participant "AuthController" as Controller
participant "AuthService" as Service
database "Redis" as Redis

Client -> Router: POST /api/v1/auth/logout
Router -> Authenticator: verify refresh token
Authenticator --> Router: requestToken in context
Router -> Controller: logout()
Controller -> Service: logout(refreshToken)
Service -> Redis: set logout blacklist key
Service --> Controller: success
Controller --> Client: 200 OK

@enduml
```

### Refresh Token

- Route: `POST /api/v1/auth/refresh-token`
- Authentication: refresh token
- Main flow:
  1. Authenticate refresh token.
  2. Generate a new access token and refresh token from JWT payload.
  3. Return tokens.

```plantuml
@startuml
title Auth - Refresh Token

actor Client
participant "authRouter" as Router
participant "authenticator(refresh)" as Authenticator
participant "AuthController" as Controller
participant "AuthService" as Service
participant "JWT" as JWT

Client -> Router: POST /api/v1/auth/refresh-token
Router -> Authenticator: verify refresh token
Authenticator --> Router: jwtPayload in context
Router -> Controller: refreshToken()
Controller -> Service: refreshToken(jwtPayload)
Service -> JWT: generate access and refresh tokens
Service --> Controller: tokens
Controller --> Client: 200 OK

@enduml
```

## User Use Cases

### Get Current User

- Route: `GET /api/v1/user/`
- Authentication: access token
- Main flow:
  1. Authenticate access token.
  2. Use JWT `userId` as the lookup ID.
  3. Find user by ID.
  4. Return `id` and `email`.
- Errors:
  - `User not found` if the authenticated user no longer exists.

```plantuml
@startuml
title User - Get Current User

actor Client
participant "userRouter" as Router
participant "authenticator(access)" as Authenticator
participant "UserController" as Controller
participant "UserService" as Service
database "MySQL" as DB

Client -> Router: GET /api/v1/user/
Router -> Authenticator: verify access token
Authenticator --> Router: jwtPayload in context
Router -> Controller: getUser()
Controller -> Service: getUserById({ id: jwtPayload.userId })
Service -> DB: find user by id
alt user missing
    Service --> Controller: BadRequestError
else user found
    Service --> Controller: user response
    Controller --> Client: 200 OK
end

@enduml
```

### Get Users

- Route: `GET /api/v1/users/`
- Validation: `getUsersRequestSchema`
- Authentication: access token
- Authorization: admin role via `authorizer("admin")`
- Query: `lastId`, `limit`, `orderBy` (`email` or `createdAt`), `page`, `sort`
- Main flow:
  1. Validate query.
  2. Authenticate access token.
  3. Check admin role.
  4. Query users with keyset pagination.
  5. Return `items`, `hasNextPage`, and `lastId`.

```plantuml
@startuml
title User - Get Users

actor Client
participant "userRouter" as Router
participant "validator" as Validator
participant "authenticator(access)" as Authenticator
participant "authorizer(admin)" as Authorizer
participant "UserController" as Controller
participant "UserService" as Service
database "Redis" as Redis
database "MySQL" as DB

Client -> Router: GET /api/v1/users/
Router -> Validator: validate query
Validator --> Router: valid query
Router -> Authenticator: verify access token
Authenticator --> Router: jwtPayload in context
Router -> Authorizer: check admin role
Authorizer -> Redis: get cached user roles
alt roles cache miss
    Authorizer -> DB: load user with roles
    Authorizer -> Redis: cache roles
end
alt not admin
    Authorizer --> Client: ForbiddenError
else admin
    Router -> Controller: getUsers(req)
    Controller -> Service: getUsers(dto)
    Service -> DB: paginateKeySet users
    Service --> Controller: paginated users
    Controller --> Client: 200 OK
end

@enduml
```

### Update Current User

- Route: `PATCH /api/v1/user/`
- Validation: `updateUserRequestSchema`
- Authentication: access token
- Rate limit: route scoped, limit `5`
- Body: at least one of optional `firstName`, `lastName`, `imageUrl`, `password`
- Main flow:
  1. Validate body.
  2. Authenticate access token.
  3. Apply route rate limit by authenticated user and route.
  4. Load current user by JWT `userId`.
  5. Hash new password if provided.
  6. Update user in a database transaction.
  7. Return updated user response.
- Errors:
  - `User not found` if authenticated user no longer exists.

```plantuml
@startuml
title User - Update Current User

actor Client
participant "userRouter" as Router
participant "validator" as Validator
participant "authenticator(access)" as Authenticator
participant "rateLimit" as RateLimit
participant "UserController" as Controller
participant "UserService" as Service
participant "bcrypt" as Bcrypt
database "MySQL" as DB

Client -> Router: PATCH /api/v1/user/
Router -> Validator: validate body
Validator --> Router: valid body
Router -> Authenticator: verify access token
Authenticator --> Router: jwtPayload in context
Router -> RateLimit: consume route limit
RateLimit --> Router: allowed
Router -> Controller: updateUser(req)
Controller -> Service: updateUser(params, body)
Service -> DB: find current user
alt user missing
    Service --> Controller: BadRequestError
else user found
    alt password provided
        Service -> Bcrypt: hash password
    end
    Service -> DB: transaction update user
    Service -> DB: get updated user by id
    Service --> Controller: updated user response
    Controller --> Client: 200 OK
end

@enduml
```

### Delete Current User

- Route: `DELETE /api/v1/user/`
- Authentication: access token
- Authorization: admin role
- Main flow:
  1. Authenticate access token.
  2. Check admin role.
  3. Use JWT `userId` as delete target.
  4. Confirm user exists.
  5. Delete user in a database transaction.
  6. Return success response.
- Errors:
  - `User not found` if authenticated user no longer exists.
  - `Forbidden` if authenticated user does not have admin role.

```plantuml
@startuml
title User - Delete Current User

actor Client
participant "userRouter" as Router
participant "authenticator(access)" as Authenticator
participant "authorizer(admin)" as Authorizer
participant "UserController" as Controller
participant "UserService" as Service
database "Redis" as Redis
database "MySQL" as DB

Client -> Router: DELETE /api/v1/user/
Router -> Authenticator: verify access token
Authenticator --> Router: jwtPayload in context
Router -> Authorizer: check admin role
Authorizer -> Redis: get cached user roles
alt roles cache miss
    Authorizer -> DB: load user with roles
    Authorizer -> Redis: cache roles
end
alt not admin
    Authorizer --> Client: ForbiddenError
else admin
    Router -> Controller: deleteUser()
    Controller -> Service: deleteUser({ id: jwtPayload.userId })
    Service -> DB: find user by id
    alt user missing
        Service --> Controller: BadRequestError
    else user found
        Service -> DB: transaction delete user
        Service --> Controller: success
        Controller --> Client: 200 OK
    end
end

@enduml
```
