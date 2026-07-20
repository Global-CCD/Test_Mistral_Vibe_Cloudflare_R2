# Cloudflare R2 Upload Website

A simple HTML website that allows users to upload files directly to a Cloudflare R2 bucket.

## Features

- Drag and drop file upload
- Multiple file selection
- File size display
- Upload status feedback
- Responsive design

## How It Works

This frontend application requires a backend service to generate pre-signed URLs for Cloudflare R2 uploads. The workflow is:

1. User selects files via the web interface
2. Frontend requests pre-signed URLs from your backend
3. Backend generates time-limited URLs for direct R2 uploads
4. Frontend uploads files directly to R2 using the pre-signed URLs

## Setup

### Prerequisites

- A Cloudflare account with R2 enabled
- An R2 bucket created
- R2 API credentials (Access Key ID and Secret Access Key)
- A backend service to generate pre-signed URLs

### Backend Requirements

Your backend needs to expose an endpoint that generates pre-signed URLs. Here's an example using Node.js with the @aws-sdk/s3-request-presigner package:

```javascript
// Example backend endpoint (Node.js with Express)
const express = require('express');
const { S3Client, PutObjectCommand } = require('@aws-sdk/client-s3');
const { getSignedUrl } = require('@aws-sdk/s3-request-presigner');

const app = express();
app.use(express.json());

const s3Client = new S3Client({
  region: 'auto',
  endpoint: `https://${ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: R2_ACCESS_KEY_ID,
    secretAccessKey: R2_SECRET_ACCESS_KEY,
  },
});

app.post('/api/generate-presigned-url', async (req, res) => {
  const { fileName, contentType } = req.body;
  
  const command = new PutObjectCommand({
    Bucket: BUCKET_NAME,
    Key: fileName,
    ContentType: contentType,
  });
  
  try {
    const uploadUrl = await getSignedUrl(s3Client, command, { expiresIn: 3600 });
    res.json({ uploadUrl });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.listen(3000, () => console.log('Backend running on port 3000'));
```

### Frontend Configuration

Update the `backendEndpoint` variable in `script.js` to point to your backend:

```javascript
const backendEndpoint = 'http://your-backend-url/api/generate-presigned-url';
```

## Deployment

### Option 1: Cloudflare Pages

1. Push this code to a GitHub repository
2. Connect the repository to Cloudflare Pages
3. Deploy the site
4. Configure your backend separately (Cloudflare Workers, or any other hosting)

### Option 2: Static Hosting

You can host these files on any static hosting service (Netlify, Vercel, GitHub Pages, etc.) and configure CORS appropriately.

## Cloudflare R2 Configuration

1. Go to Cloudflare Dashboard > R2 > Manage buckets
2. Create a new bucket or select an existing one
3. Go to Settings > Access Keys
4. Create a new access key with appropriate permissions
5. Note your Account ID, Access Key ID, and Secret Access Key

## Security Considerations

- Never expose your R2 credentials in frontend code
- Use pre-signed URLs with short expiration times (e.g., 1 hour)
- Implement CORS on your R2 bucket to restrict which domains can upload
- Consider adding authentication to your backend endpoint

## Customization

- Modify `style.css` to change the appearance
- Update `index.html` to add/remove UI elements
- Extend `script.js` to add additional functionality (progress bars, file previews, etc.)

## License

MIT