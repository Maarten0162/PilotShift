using UnityEngine;
using UnityEngine.Splines;
using Unity.Mathematics;
using System.Collections.Generic;
using System.Numerics;

public class CheckpointGenerator : MonoBehaviour
{
    [SerializeField] private int checkpointAmount  = 1;
    [SerializeField] public SplineContainer splineContainer;
    [SerializeField] private GameObject checkpointPrefab;
    private List<Checkpoint> list;
    public List<Checkpoint> Checkpoints => list;
    public UnityEngine.Vector3 StartPos {get; private set;}
    public UnityEngine.Quaternion StartRot {get; private set;}

    
    private float length;
    private float steps;
    public int nextCheckpointIndex {get; private set;} = 0;
    

    void Awake()
    {
        length = splineContainer.CalculateLength();
        steps = length / checkpointAmount ;
        list = new();
        if (true)
        {
            splineContainer.Evaluate(0f, out float3 position, out float3 tangent, out float3 up);
            StartPos = position;
            StartRot = UnityEngine.Quaternion.LookRotation(tangent, up);
        }
        for (int i = 0; i < checkpointAmount ; i++)
        {
            float t = splineContainer.Spline.ConvertIndexUnit(
            steps * (i + 1),
            PathIndexUnit.Distance,
            PathIndexUnit.Normalized
            );
            splineContainer.Evaluate(t, out float3 position, out float3 tangent, out float3 up);
            Checkpoint checkpoint = Instantiate(checkpointPrefab, position, UnityEngine.Quaternion.LookRotation(tangent, up)).GetComponentInChildren<Checkpoint>();
            checkpoint.index = i; 
            checkpoint.generator = this;
            Debug.Log(checkpoint.transform.root.name);
            

            if(i == 0) checkpoint.setState(Checkpoint.CheckpointState.Next);
            else checkpoint.setState(Checkpoint.CheckpointState.Normal);            
            list.Add(checkpoint);  
        }
    }

    public void ReachCheckpoint(int index)
    {
        if (index == nextCheckpointIndex)
        {
            if(list[index].Reached)
            {
                Debug.Log("Checkpoint already reached!");
                return;   
            }

            list[index].Reached = true;
            list[index].setState(Checkpoint.CheckpointState.Reached);
            list[index + 1].setState(Checkpoint.CheckpointState.Next);
            nextCheckpointIndex++;
            Debug.Log("Correct checkpoint!");
        }
        else
        {
            Debug.Log("Wrong checkpoint!");
        }
    }
}
