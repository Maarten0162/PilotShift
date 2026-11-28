using UnityEngine;

[RequireComponent(typeof(Rigidbody))]
public class SpaceshipController : MonoBehaviour
{
    private PlayerControls controls;
    private Rigidbody rb;
    [SerializeField] private float thrustForce = 10f;
    [SerializeField] private float pitchSpeed = 2.5f; //turn rates in radians per second
    [SerializeField] private float yawSpeed = 1.5f;
    [SerializeField] private float rollSpeed = 3.5f;
    [SerializeField] private float turnResponsiveness = 20f; //how fast the ship reaches the target turn rate, higher is snappier
    [SerializeField] private float maxSpeed = 20f;
    [SerializeField] private bool useMotion = false;

    //websocket
    [SerializeField] private YokeReceiver receiver;
    [SerializeField] private GameManager gameManager;    
    [SerializeField] private GameObject arrow;    


    //game

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
        rb.interpolation = RigidbodyInterpolation.Interpolate; //smooths movement between physics steps so the ship and camera dont stutter
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

    void Start()
    {
        this.gameObject.transform.position = gameManager.checkpointGenerator.StartPos;
        this.gameObject.transform.rotation = gameManager.checkpointGenerator.StartRot;
    }

    void Update()
    {
        if(gameManager.CurrentState == GameManager.GameState.Active)
        {
            if (useMotion)
            {
                moveInput = 25f;
                rollInput = receiver.RollValue;
                pitchInput = receiver.PitchValue;

            }
            else
            {
                moveInput = controls.Player.Move.ReadValue<float>();
            
                pitchInput = controls.Player.Pitch.ReadValue<float>();
                rollInput = controls.Player.Roll.ReadValue<float>();

            }
            yawInput = controls.Player.Yaw.ReadValue<float>();


            moveDirection = transform.forward * moveInput;      
            rotationDirection = new(pitchInput, yawInput, -rollInput);
        }else if (gameManager.CurrentState == GameManager.GameState.Finished){
            arrow.SetActive(false);
        }
        else
        {
            moveInput = 0f;
            pitchInput = 0f;
            yawInput = 0f;
            rollInput = 0f;

            moveDirection = Vector3.zero;
            rotationDirection = Vector3.zero;
        }
        pointArrow();
        
    }

    void FixedUpdate()
    {   
        if (gameManager.CurrentState == GameManager.GameState.Active)
        {
             rb.AddForce(moveDirection * thrustForce, ForceMode.Force);
            Vector3 clampedValue = Vector3.ClampMagnitude(rb.linearVelocity, maxSpeed);
            rb.linearVelocity = clampedValue;

            Vector3 targetAngularVelocity = rb.rotation * Vector3.Scale(rotationDirection, new Vector3(pitchSpeed, yawSpeed, rollSpeed)); //rb.rotation turns the local turn rates into world space
            rb.angularVelocity = Vector3.Lerp(rb.angularVelocity, targetAngularVelocity, turnResponsiveness * Time.fixedDeltaTime);
        }
    }

    private void pointArrow()
    {
        CheckpointGenerator gen = gameManager.checkpointGenerator;

        Vector3 direction = gen.Checkpoints[gen.nextCheckpointIndex].transform.position - arrow.transform.position;

        arrow.transform.rotation = Quaternion.LookRotation(direction);
        arrow.transform.position = rb.transform.position + new Vector3(0,3,0);
    }
}
