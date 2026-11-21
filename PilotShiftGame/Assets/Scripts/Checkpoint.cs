using System;
using UnityEngine;

public class Checkpoint : MonoBehaviour
{
    public enum CheckpointState
    {
        Normal,
        Next,
        Reached
    }

    private Color normalColor;
    private Color nextColor;
    private Color reachedColor;

    public int index = -1;
    public bool Reached = false;
    public CheckpointGenerator generator;
    private MeshRenderer renderer;
    
    void Awake()
    {
        ColorUtility.TryParseHtmlString("#FF0025", out normalColor);
        ColorUtility.TryParseHtmlString("#00FFFA", out nextColor);
        ColorUtility.TryParseHtmlString("#0BFF00", out reachedColor);

        renderer = transform.parent.GetChild(0).GetComponent<MeshRenderer>();
        Debug.Log(renderer);
        renderer.material.SetColor("_BaseColor", normalColor);
        renderer.material.SetColor("_EmissionColor", normalColor);
    }

    private void OnTriggerEnter(Collider other)
    {
        if (index == -1) Debug.LogError("Checkpoint index not set");
        else
        {
            if (other.CompareTag("Player"))
            {
                Debug.Log("Entered Checkpoint");
                generator.ReachCheckpoint(index);
            }
        }
        
    }

    public void setState(CheckpointState state)
    {
        switch (state)
        {
            case CheckpointState.Normal:
                renderer.material.SetColor("_BaseColor", normalColor);
                renderer.material.SetColor("_EmissionColor", normalColor);
                break;

            case CheckpointState.Next:
                renderer.material.SetColor("_BaseColor", nextColor);
                renderer.material.SetColor("_EmissionColor", nextColor);
                break;

            case CheckpointState.Reached:
                renderer.material.SetColor("_BaseColor", reachedColor);
                renderer.material.SetColor("_EmissionColor", reachedColor);
                break;
        }
    }
}
