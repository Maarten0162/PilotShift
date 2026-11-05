
using UnityEditor.Experimental.GraphView;
using UnityEngine;
using UnityEngine.InputSystem;

[RequireComponent(typeof(Rigidbody))]
public class SpaceshipController : MonoBehaviour
{
    private PlayerControls controls;
    private Rigidbody rb;
    [SerializeField] private float thrustForce = 10f;
    [SerializeField] private float maxSpeed = 20f;



    private Vector3 moveDirection = new(0,0,0);

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
        Vector2 movement = controls.Player.Move.ReadValue<Vector2>().normalized;
        moveDirection = (transform.right * movement.x) + (transform.forward * movement.y);
    }

    void FixedUpdate()
    {   
        rb.AddForce(moveDirection, ForceMode.Force);
        Vector3 clampedValue = Vector3.ClampMagnitude(rb.linearVelocity, maxSpeed);
        rb.linearVelocity = clampedValue;
    }
    void OnMove()
    {
        
    }
}
