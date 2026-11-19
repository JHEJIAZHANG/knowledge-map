# 真终端机用的镜像：尽量和 LabEx 一样（Ubuntu 22.04、zsh、Python 3.10.12、labex 的 UID 是 5000）
FROM ubuntu:22.04
ENV DEBIAN_FRONTEND=noninteractive
RUN apt-get update \
 && apt-get install -y --no-install-recommends zsh sudo python3 nano vim tree procps less \
 && rm -rf /var/lib/apt/lists/*
RUN groupadd -g 5000 labex \
 && groupadd -g 5002 public \
 && groupadd -g 121 ssl-cert \
 && useradd -m -u 5000 -g labex -G sudo,ssl-cert,public -s /usr/bin/zsh labex \
 && echo 'labex ALL=(ALL) NOPASSWD:ALL' > /etc/sudoers.d/labex \
 && mkdir /home/labex/project && chown labex:labex /home/labex/project && chmod 775 /home/labex/project
USER labex
RUN touch /home/labex/.zshrc
WORKDIR /home/labex/project
CMD ["zsh"]
