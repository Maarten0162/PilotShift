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
        Debug.Log("delay: " + delay + " Rollvalue: " + data.roll + " PitchValue: " + data.pitch + "YawValue:" + "NaN");
        receiver.RollValue = data.roll;
        receiver.PitchValue = data.pitch;
    }
}