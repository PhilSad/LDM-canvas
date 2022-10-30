yes | sudo /opt/deeplearning/install-driver.sh
yes | sudo gcloud auth configure-docker europe-west1-docker.pkg.dev
sudo docker run --gpus all europe-west1-docker.pkg.dev/ai-canvas/kollai-docker-repo/kollai-imagen
