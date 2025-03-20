package main

import (
        "context"
        "log"
        "net"

        "google.golang.org/grpc"
        pb "github.com/mprokopjc/dummy-service/dummy"
)

type server struct {
        pb.UnimplementedDummyServiceServer
}

func (s *server) GetMessage(ctx context.Context, in *pb.Request) (*pb.Response, error) {
        return &pb.Response{Message: "Hello, " + in.GetName()}, nil
}

func main() {
        lis, err := net.Listen("tcp", ":50051")
        if err != nil {
                log.Fatalf("failed to listen: %v", err)
        }
        s := grpc.NewServer()
        pb.RegisterDummyServiceServer(s, &server{})
        if err := s.Serve(lis); err != nil {
                log.Fatalf("failed to serve: %v", err)
        }
}