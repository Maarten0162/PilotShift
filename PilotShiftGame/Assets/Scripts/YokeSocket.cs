using UnityEngine;
using WebSocketSharp;
using WebSocketSharp.Server;

public class YokeSocket : WebSocketBehavior
{
    public YokeReceiver receiver;
    protected override void OnMessage(MessageEventArgs e)
    {
        Debug.Log("Received: " + e.Data);
        receiver.RollValue = float.Parse(e.Data);
    }
}