echo "start dockerizing!"
echo "."
echo ".."
echo "..."

docker stop $(docker ps -q --filter="name=tiptap-api-server")
docker rm $(docker ps -q --filter="name=tiptap-api-server")

result=`docker images tiptap`
target=`echo $result | cut -d ' ' -f9`
docker rmi $target

docker build -t tiptap:v0.1 .
docker run --name=tiptap-api-server -d -v /etc/localtime:/etc/localtime:ro -v /home/ec2-user/TipTap_Server/image:/app/tiptap/image -e TZ=Asia/Seoul -p 8080:8080 tiptap:v0.1 -name tiptap-api-server

echo "."
echo "."
echo "."
echo "completed api-server dockerizing!"
