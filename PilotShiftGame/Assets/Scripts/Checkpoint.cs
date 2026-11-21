using UnityEngine;

public class Checkpoint : MonoBehaviour
{
    public int index = -1;
    public bool Reached = false;

    private void OnTriggerEnter(Collider other)
    {
        if (index == -1) Debug.LogError("Checkpoint index not set");
        else
        {
            if (other.CompareTag("Player"))
            {
                Debug.Log("Entered Checkpoint");
                Reached = true;
            }
        }
        
    }
}
