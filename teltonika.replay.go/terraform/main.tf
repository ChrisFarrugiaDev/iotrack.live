# Create the main S3 bucket
# This bucket will be called: iotrack.live
resource "aws_s3_bucket" "iotrack_live" {
  bucket = "iotrack.live"

  tags = {
    Name        = "iotrack.live"
    Project     = "iotrack.live"
    Service     = "teltonika.replay.go"
    Environment = "prod"
  }
}

# ----------------------------------------------------------------------

# Allow this bucket to have a public bucket policy
# By default, AWS blocks public access, so we disable those blocks here
resource "aws_s3_bucket_public_access_block" "iotrack_live" {
  bucket = aws_s3_bucket.iotrack_live.id

  block_public_acls       = false
  block_public_policy     = false
  ignore_public_acls      = false
  restrict_public_buckets = false
}

# Add a public read policy
# This allows anyone to read/download files from this bucket
# Use path-style URLs — dotted bucket names break the virtual-hosted TLS cert:
# https://s3.eu-west-1.amazonaws.com/iotrack.live/teltonika.replay.go/data/file.csv
resource "aws_s3_bucket_policy" "iotrack_live_public_read" {
  bucket = aws_s3_bucket.iotrack_live.id

  # Make sure public access block is updated before applying the policy
  depends_on = [
    aws_s3_bucket_public_access_block.iotrack_live
  ]

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid       = "PublicReadObjects"
        Effect    = "Allow"
        Principal = "*"

        # Allow public read access to objects/files only
        Action = "s3:GetObject"

        # Apply the policy to every file inside the bucket
        Resource = "${aws_s3_bucket.iotrack_live.arn}/*"
      }
    ]
  })
}

# ----------------------------------------------------------------------

# Create a folder-like object:
# s3://iotrack.live/teltonika.replay.go/
#
# S3 does not have real folders.
# Folders are just object key prefixes.
resource "aws_s3_object" "teltonika_replay_folder" {
  bucket  = aws_s3_bucket.iotrack_live.id
  key     = "teltonika.replay.go/"
  content = ""
}

# Create the data folder-like object:
# s3://iotrack.live/teltonika.replay.go/data/
#
# Your CSV files will go inside this prefix.
resource "aws_s3_object" "teltonika_replay_data_folder" {
  bucket  = aws_s3_bucket.iotrack_live.id
  key     = "teltonika.replay.go/data/"
  content = ""
}