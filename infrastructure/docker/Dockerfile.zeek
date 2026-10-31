FROM zeek/zeek:6.0.3

WORKDIR /zeek

# Copy custom PrivacyLens Zeek inspection scripts
COPY infrastructure/zeek/privacylens.zeek /usr/local/zeek/share/zeek/site/privacylens.zeek

# Enable the script in local.zeek
RUN echo '@load site/privacylens.zeek' >> /usr/local/zeek/share/zeek/site/local.zeek

ENTRYPOINT ["zeek"]
CMD ["-C", "-i", "eth0", "local"]

