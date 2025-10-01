go mod init iotrack.live/image.server.go

curl -F "entity_type=asset" -F "entity_id=1"   -F "images=@img1.png"  -F "images=@img2.jpg"   http://iotrack.live/upload/images