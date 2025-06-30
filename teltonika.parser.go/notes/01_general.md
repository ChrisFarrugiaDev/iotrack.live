scp -i ~/.ssh_iot/id_ecdsa teltonika.parser ubuntu@57.129.34.12:/home/ubuntu/

alias ssh_ovh_thingsboard


scp -i ~/.ssh_iot/id_ecdsa .env.development ubuntu@57.129.34.12:/home/ubuntu/

go build -o teltonika.parser cmd/parser/* ; scp -i ~/.ssh_iot/id_ecdsa teltonika.parser ubuntu@57.129.34.12:/home/ubuntu/


go run ./cmd/parser/.




rsync -az --delete --exclude=node_modules -e "ssh -i ~/.ssh_iot/id_ecdsa" /home/chrfa/c/Chris/projects/iotrack.live-main/* ubuntu@57.129.22.122:/home/ubuntu/projects/iotrack.live

rsync -az --delete --exclude=node_modules -e "ssh -i ~/.ssh/ssh_iot/id_ecdsa" /home/foxcodenine/foxfiles/git/chrisfarrugia.dev/iotrack.live ubuntu@57.129.22.122:/home/ubuntu/projects

ssh-add ~/.ssh/chris_farrugia_dev_git/chris_farrugia_dev_git


chatgpt setions:
https://chatgpt.com/c/684868ac-01b8-8013-9c5f-4ac0033a3744
https://chatgpt.com/c/68433197-4d68-8013-a554-b6dbe783acc5