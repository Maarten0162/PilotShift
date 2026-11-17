using System;
using System.Linq;
using UnityEngine;
using WebSocketSharp;
using WebSocketSharp.Server;


public class YokeSocket : WebSocketBehavior
{
    public YokeReceiver receiver;

    protected override void OnMessage(MessageEventArgs e)
    {
        websocketClass data = JsonUtility.FromJson<websocketClass>(e.Data);
        double delay = DateTimeOffset.UtcNow.ToUnixTimeMilliseconds() - data.time;
        Debug.Log("delay: " + delay + " value: " + data.roll);
        receiver.RollValue = data.roll;
        receiver.PitchValue = data.pitch;
    }
}