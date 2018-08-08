echo "start dockerizing"

docker stop $(docker ps -a -q)
docker rm $(docker ps -a -q)

result=`docker image ls`
target=`echo $result | cut -d ' ' -f9`
docker rmi $target

docker build -t travel:v0.1 .
docker run -d -v /home/ec2-user/travel-log/image:/app/travel/image -p 8080:8081 travel:v0.1

echo "completed dockerizing!"
