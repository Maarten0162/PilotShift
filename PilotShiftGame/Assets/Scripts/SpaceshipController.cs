
using UnityEditor;
using UnityEditor.Experimental.GraphView;
using UnityEngine;
using UnityEngine.InputSystem;

[RequireComponent(typeof(Rigidbody))]
public class SpaceshipController : MonoBehaviour
{
    private PlayerControls controls;
    private Rigidbody rb;
    [SerializeField] private float thrustForce = 10f;
    [SerializeField] private float rotationForce = 10f;
    [SerializeField] private float maxSpeed = 20f;



    private Vector3 moveDirection = new(0,0,0);
    private Vector3 rotationDirection = new(0,0,0);
    private float moveInput = 0f;

    private float pitchInput = 0f;
    private float yawInput = 0f;
    private float rollInput = 0f;


    void Awake()
    {
        controls = new PlayerControls();
        rb = this.GetComponent<Rigidbody>();
    }
    void OnEnable()
    {
        controls.Player.Enable();
        
    }
    void OnDisable()
    {
        controls.Player.Disable();
    }

    private void OnDestroy()
    {
        controls.Dispose();
    }

    void Update()
    {
        moveInput = controls.Player.Move.ReadValue<float>();
        pitchInput = controls.Player.Pitch.ReadValue<float>();
        yawInput = controls.Player.Yaw.ReadValue<float>();
        rollInput = controls.Player.Roll.ReadValue<float>();

        moveDirection = transform.forward * moveInput;      
        rotationDirection = new(pitchInput, yawInput, -rollInput);
    }

    void FixedUpdate()
    {   
        rb.AddForce(moveDirection * thrustForce, ForceMode.Force);
        Vector3 clampedValue = Vector3.ClampMagnitude(rb.linearVelocity, maxSpeed);
        rb.linearVelocity = clampedValue;

        rb.AddTorque(transform.TransformDirection(rotationDirection * rotationForce), ForceMode.Force); //transform.transformdirection turns world axis to local axis
    }
    void OnMove()
    {
        
    }
}
