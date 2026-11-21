using UnityEngine;
using UnityEngine.Splines;
using Unity.Mathematics;
using System.Collections.Generic;

public class CheckpointGenerator : MonoBehaviour
{
    [SerializeField] private int checkpointAmount  = 1;
    [SerializeField] private SplineContainer splineContainer;
    [SerializeField] private GameObject checkpointPrefab;
    private List<Checkpoint> list;
    public List<Checkpoint> Checkpoints => list;

    private float length;
    private float steps;
     
    void Start()
    {
        length = splineContainer.CalculateLength();
        steps = length / checkpointAmount ;
        list = new();
        for (int i = 0; i < checkpointAmount ; i++)
        {
            float t = splineContainer.Spline.ConvertIndexUnit(
            steps * (i + 1),
            PathIndexUnit.Distance,
            PathIndexUnit.Normalized
            );
            splineContainer.Evaluate(t, out float3 position, out float3 tangent, out float3 up);
            Checkpoint checkpoint = Instantiate(checkpointPrefab, position, Quaternion.LookRotation(tangent, up)).GetComponentInChildren<Checkpoint>();
            checkpoint.index = i; 


            list.Add(checkpoint);  
        }
    }
}
