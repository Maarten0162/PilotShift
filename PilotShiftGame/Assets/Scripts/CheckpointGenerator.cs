using UnityEngine;
using UnityEngine.Splines;
using Unity.Mathematics;

public class CheckpointGenerator : MonoBehaviour
{
    [SerializeField] private int checkpointAmount  = 1;
    [SerializeField] private SplineContainer splineContainer;
    [SerializeField] private GameObject checkpointPrefab;

    private float length = -1f;
    private float steps;
     
    void Start()
    {
        length = splineContainer.CalculateLength();
        steps = length / checkpointAmount ;
     
        for (int i = 0; i < checkpointAmount ; i++)
        {
            float t = splineContainer.Spline.ConvertIndexUnit(
            steps * (i + 1),
            PathIndexUnit.Distance,
            PathIndexUnit.Normalized
            );
            splineContainer.Evaluate(t, out float3 position, out float3 tangent, out float3 up);
            Instantiate(checkpointPrefab, position, Quaternion.LookRotation(tangent, up));
        }
    }

    

    // Update is called once per frame
    void Update()
    {
        
    }
}
