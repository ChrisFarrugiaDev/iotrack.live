scp -i ~/.ssh_iot/id_ecdsa parser.teltonika ubuntu@57.129.34.12:/home/ubuntu/

alias ssh_ovh_thingsboard


scp -i ~/.ssh_iot/id_ecdsa .env.development ubuntu@57.129.34.12:/home/ubuntu/

go build -o parser.teltonika cmd/parser/* ; scp -i ~/.ssh_iot/id_ecdsa parser.teltonika ubuntu@57.129.34.12:/home/ubuntu/


go run ./cmd/parser/.