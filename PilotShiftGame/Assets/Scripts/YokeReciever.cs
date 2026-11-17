using UnityEngine;
using WebSocketSharp;
using WebSocketSharp.Server;
using System;

public class YokeReceiver : MonoBehaviour
{
    private WebSocketServer server;
    public float RollValue = 0f;
    public float PitchValue = 0f;

    void Start()
    {
        server = new WebSocketServer(8080);
        server.AddWebSocketService<YokeSocket>(
            "/yoke",
            (socket) => { socket.receiver = this;}
        );
        server.Start();

        Debug.Log("WebSocket server started on port 8080");
    }

    void OnDestroy()
    {
        server?.Stop();
    }
}
