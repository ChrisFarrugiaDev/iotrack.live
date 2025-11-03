go mod init iotrack.live/image.server.go

curl -X POST -F "entity_type=asset" -F "entity_id=1"   -F "images=@img1.jpg"  -F "images=@img2.jpg"   http://iotrack.live/img/upload

curl -X DELETE http://iotrack.live/img/image/37

curl -X DELETE http://iotrack.live/img/images  -H "Content-Type: application/json"  -d '{"entity_type":"asset","entity_id":74}'

<!-- --------------------------------------------------------------- -->

# 1) Upload (multipart)
curl -X POST -F "entity_type=asset" \
     -F "entity_id=1" \
     -F "images=@img1.jpg" \
     -F "images=@img2.jpg" \
     -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJmOGYyZGEzMy0xZDE2LTRlYjUtOGJiOS1mYTNlYmY5ZTdiOTkiLCJpZCI6IjIiLCJlbWFpbCI6ImFsaWNlQGFjbWUuY29tIiwib3JnX2lkIjoiMSIsInRva2VuX3ZlcnNpb24iOjMwMiwiaWF0IjoxNzU5MzEyMTg0LCJleHAiOjE3NTkzNTUzODR9.U-sTs2AqT5Esgxj-2kEk-ytsjzciFuzqgfxapmdFHKY" \
     http://iotrack.live/img/upload
npm run de
# 2) Delete single image (no body)
curl -X DELETE \
     -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJmOGYyZGEzMy0xZDE2LTRlYjUtOGJiOS1mYTNlYmY5ZTdiOTkiLCJpZCI6IjIiLCJlbWFpbCI6ImFsaWNlQGFjbWUuY29tIiwib3JnX2lkIjoiMSIsInRva2VuX3ZlcnNpb24iOjMwMiwiaWF0IjoxNzU5MzEyMTg0LCJleHAiOjE3NTkzNTUzODR9.U-sTs2AqT5Esgxj-2kEk-ytsjzciFuzqgfxapmdFHKY" \
     http://iotrack.live/img/delete/60

# 3) Delete by entity (JSON body)
curl -X DELETE \
     -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJmOGYyZGEzMy0xZDE2LTRlYjUtOGJiOS1mYTNlYmY5ZTdiOTkiLCJpZCI6IjIiLCJlbWFpbCI6ImFsaWNlQGFjbWUuY29tIiwib3JnX2lkIjoiMSIsInRva2VuX3ZlcnNpb24iOjMwMiwiaWF0IjoxNzU5MzEyMTg0LCJleHAiOjE3NTkzNTUzODR9.U-sTs2AqT5Esgxj-2kEk-ytsjzciFuzqgfxapmdFHKY" \
     -H "Content-Type: application/json" \
     -d '{"entity_type":"asset","entity_id":1}' \
     http://iotrack.live/img/delete


# 4) Get
curl -X GET \
     -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJmOGYyZGEzMy0xZDE2LTRlYjUtOGJiOS1mYTNlYmY5ZTdiOTkiLCJpZCI6IjIiLCJlbWFpbCI6ImFsaWNlQGFjbWUuY29tIiwib3JnX2lkIjoiMSIsInRva2VuX3ZlcnNpb24iOjMwMiwiaWF0IjoxNzU5MzEyMTg0LCJleHAiOjE3NTkzNTUzODR9.U-sTs2AqT5Esgxj-2kEk-ytsjzciFuzqgfxapmdFHKY" \
     "http://iotrack.live/img/list?entity_type=asset&entity_id=1&page=1&limit=20"


