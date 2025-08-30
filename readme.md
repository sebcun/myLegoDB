# myLegoDB

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
![as](https://hackatime-badge.hackclub.com/U0971C3C44D/myLegoDB)

myLegoDB is a website built with Flask that allows users to share LEGO sets they have built. Users can register for accounts, upload images of their LEGO sets, browse other users' collections, like uploads, favourite sets, and follow other users.

This project was created for the [Hackclub](https://hackclub.com/) YSWS, [Authly](https://authly.hackclub.com/). A challenge where the goal was to create a unique and fun authentication system. For me, this was to create a LEGO minifigure builder for users, and a "Build Your Password" where you place bricks of different sizes and colours on a grid for your password.

## Features

- User registration and authentication
  - "Create Your Username" - A LEGO minifigure builder for usernames.
  - "Build Your Password" - A grid where you place bricks of different sizes and colours for passwords.
- Upload and display LEGO set images
- Browse and search LEGO sets
- User profiles with follower/following functionality
- Like and favourite features for sets and uploads

## Stack

### Backend

![Flask](https://img.shields.io/badge/flask-%23000.svg?style=for-the-badge&logo=flask&logoColor=white)
![Python](https://img.shields.io/badge/python-3670A0?style=for-the-badge&logo=python&logoColor=ffdd54)
![SQLite](https://img.shields.io/badge/sqlite-%2307405e.svg?style=for-the-badge&logo=sqlite&logoColor=white)

### Frontend

![HTML5](https://img.shields.io/badge/html5-%23E34F26.svg?style=for-the-badge&logo=html5&logoColor=white)
![Jinja](https://img.shields.io/badge/jinja-white.svg?style=for-the-badge&logo=jinja&logoColor=black)
![JavaScript](https://img.shields.io/badge/javascript-%23323330.svg?style=for-the-badge&logo=javascript&logoColor=%23F7DF1E)
![CSS3](https://img.shields.io/badge/css3-%231572B6.svg?style=for-the-badge&logo=css3&logoColor=white)
![Bootstrap](https://img.shields.io/badge/bootstrap-%238511FA.svg?style=for-the-badge&logo=bootstrap&logoColor=white)

## Setup

### Requirements

- Python 3.11+

### Setup

1. Clone the repository

```bash
git clone https://github.com/Catch-c/nsimon.git
cd nsimon
```

2. Install dependencies

```py
pip install -r requirements.txt
```

3. Create a `.env` file in the root directory:

```env
SECRET_KEY=your-flask-secret-key
DATABASE_FILE=database.db
```

4. Run the application

```py
python app.py
```

The application will be available at [http://localhost:5000](http://localhost:5000)

## API Endpoints

This application provides several API endpoints available for you to use. All endpoints return JSON responses.

### [/api/uploads](http://localhost:5000/api/uploads)

Retrieves a list of uploads with optional filtering and pagination.

#### Query Parameters

- `limit` (int, default: 20): Maximum number of uploads to return. This is only used when `sort` is set to 'random'.
- `sort` (str, default: 'newest'): Sort order - 'newest', 'oldest', or 'random'.
- `page` (int, default: 1): Page number for pagination.
- `per_page` (int, default: 20): Number of uploads per page.
- `author` (int, optional): Filter by user ID.
- `set` (str, optional): Filter by set ID.
- `following` (bool, default: false): If true, only show uploads from the authenticated users user follows.

#### Example Usage

```
GET /api/uploads?limit=10&sort=random
```

#### Response

```json
{
  "uploads": [
    {
      "id": 1,
      "author": "username",
      "setid": "10251-1",
      "image": "path/to/image.jpg",
      "created_at": "2025-08-30T12:00:00",
      "likes": 5,
      "liked": true
    }
  ],
  "total": 20,
  "page": 1,
  "per_page": 20
}
```
