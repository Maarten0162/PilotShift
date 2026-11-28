using UnityEngine;

public class CameraController : MonoBehaviour
{
    [SerializeField] private Transform target;

    [Header("Position")]
    [SerializeField] private Vector3 offset = new Vector3(0, 3, -8);
    [SerializeField] private float smoothTime = 1f;
    [SerializeField] private float rotationSpeed = 3f;

    private Vector3 velocity;

    void LateUpdate()
    {
        Vector3 desiredPosition = target.TransformPoint(offset);
        Quaternion desiredRotation = Quaternion.LookRotation(target.forward, target.up);


        
        this.transform.position = Vector3.SmoothDamp(transform.position, desiredPosition, ref velocity, smoothTime, 15f);
        this.transform.rotation = Quaternion.Slerp(transform.rotation, desiredRotation, rotationSpeed * Time.deltaTime);
    }
}