
using UnityEngine;
using UnityEngine.InputSystem;

[RequireComponent(typeof(Rigidbody))]
public class SpaceshipController : MonoBehaviour
{
    [Header("Movement")]
    [SerializeField] private float movementSpeed = 10f;

    [Header("Barrel Roll")]
    [SerializeField] private float barrelRollSpeed = 120f;

    private Rigidbody rb;
    private PlayerInput playerInput;

    private InputAction moveAction;
    private InputAction rollAction;

    private void Awake()
    {
        rb = GetComponent<Rigidbody>();
        playerInput = GetComponent<PlayerInput>();

        rb.useGravity = false;
        rb.interpolation = RigidbodyInterpolation.Interpolate;
    }

    private void Start()
    {
        moveAction = playerInput.actions.FindAction("Tilt", true);
        rollAction = playerInput.actions.FindAction("Roll", true);
    }

    private void FixedUpdate()
    {
        float movement = moveAction.ReadValue<float>();
        float roll = rollAction.ReadValue<float>();

        // W and S: Move up and down
        rb.MovePosition(
            rb.position + Vector3.up * movement * movementSpeed * Time.fixedDeltaTime
        );

        // A and D: Barrel roll
        rb.MoveRotation(
            rb.rotation * Quaternion.Euler(
                0f,
                0f,
                -roll * barrelRollSpeed * Time.fixedDeltaTime
            )
        );
    }
}
