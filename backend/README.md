# VlogToBlog Backend API Server 🚀

This is the backend server for VlogToBlog, built using **Node.js** and **Express.js**. It handles downloading transcripts, parsing YouTube page data, and prompting the **Gemini AI API** to produce clean, formatted markdown blog posts.

---

## 🛠️ Tech Stack & Key Modules
- **Express.js**: Core routing framework.
- **Helmet**: Secures HTTP response headers.
- **Morgan**: Logs incoming network requests.
- **Express Rate Limit**: Implements API rate limiting to avoid abuse (limits IP requests to 30 conversions per 15 minutes).
- **Google Generative AI SDK**: Official integration for modern Gemini models.

---

## 📡 API Endpoints

### 1. Health Check
Checks if the API is up and running.
- **URL**: `/health`
- **Method**: `GET`
- **Response**:
  ```json
  {
    "success": true,
    "status": "healthy",
    "message": "VlogToBlog API is running smoothly"
  }
  ```

---

### 2. Convert Video to Blog Post
Performs the core transcript scraping and blog generation.
- **URL**: `/api/convert`
- **Method**: `POST`
- **Headers**: `Content-Type: application/json`
- **Body Parameters**:
  - `url` (string, **required**): The full URL of the YouTube video.
  - `tone` (string, optional): Writing style. Options: `'casual'`, `'formal'`, `'educational'`, `'technical'`, `'inspirational'`, `'humorous'`. (Default: `'casual'`)
  - `format` (string, optional): Layout format. Options: `'standard'`, `'tutorial'`, `'qa'`, `'listicle'`. (Default: `'standard'`)
  - `length` (string, optional): Output size. Options: `'short'`, `'medium'`, `'long'`. (Default: `'medium'`)
  - `language` (string, optional): Target language. (Default: `'english'`)

- **Example Request**:
  ```json
  {
    "url": "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
    "tone": "educational",
    "format": "tutorial",
    "length": "medium",
    "language": "english"
  }
  ```

- **Example Successful Response (200 OK)**:
  ```json
  {
    "success": true,
    "metadata": {
      "videoId": "dQw4w9WgXcQ",
      "title": "Rick Astley - Never Gonna Give You Up (Official Music Video)",
      "author": "Rick Astley",
      "durationSeconds": 212,
      "durationStr": "3:32",
      "thumbnail": "https://i.ytimg.com/vi/dQw4w9WgXcQ/maxresdefault.jpg",
      "url": "https://www.youtube.com/watch?v=dQw4w9WgXcQ"
    },
    "blog": "# Masterclass in Commitment: Never Gonna Give You Up Explained\n\n[Full structured markdown blog article here...]\n\n---\n> **SEO Slug**: never-gonna-give-you-up-explained\n> **Meta Description**: Dive into the core themes of loyalty, trust, and ultimate devotion from the timeless classic 'Never Gonna Give You Up' in this comprehensive tutorial.",
    "transcript": {
      "fullText": "We're no strangers to love You know the rules and so do I...",
      "segments": [
        {
          "text": "We're no strangers to love",
          "startMs": 1500,
          "timeStr": "0:01"
        },
        ...
      ]
    }
  }
  ```

- **Example Error Response (400/500 Error)**:
  ```json
  {
    "success": false,
    "error": "The provided URL is not a valid YouTube video link. Please double-check and try again."
  }
  ```
