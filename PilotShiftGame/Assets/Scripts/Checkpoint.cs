using UnityEngine;

public class Checkpoint : MonoBehaviour
{
    public int checkpointIndex = -1;
    public bool Reached = false;

    private void OnTriggerEnter(Collider other)
    {
        if (checkpointIndex == -1) Debug.LogError("Checkpoint index not set");
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
