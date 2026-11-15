using UnityEngine;
using WebSocketSharp;
using WebSocketSharp.Server;
using System;

public class YokeReceiver : MonoBehaviour
{
    private WebSocketServer server;

    void Start()
    {
        server = new WebSocketServer(8080);
        server.AddWebSocketService<YokeSocket>("/yoke");
        server.Start();

        Debug.Log("WebSocket server started on port 8080");
    }

    void OnDestroy()
    {
        server?.Stop();
    }
}
