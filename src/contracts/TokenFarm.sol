pragma solidity ^0.5.0;

// Imports
import './DappToken.sol';
import './DaiToken.sol';

contract TokenFarm {
    // Variables
    string public name = "Dapp Token Farm";
    DappToken public dappToken; // Contrato del Token Dapp
    DaiToken public daiToken; // Contrato del Token DAI
    address public owner; // Dirección del dueño del contrato
    mapping(address => uint) public stakingBalance; // Balance de los usuarios
    mapping(address => bool) public hasStaked; // Control para saber si un usuario ha hecho staking
    address[] public stakers; // Contiene los usuarios que han hecho stake
    mapping(address => bool) public isStaking; // Control para saber si un usuario está haciendo staking

    // Constructor
    constructor(DappToken _dappToken, DaiToken _daiToken) public {
        dappToken = _dappToken;
        daiToken = _daiToken;
        owner = msg.sender;
    }

    // Funciones
    /**
     * @notice Función que permite hacer stake (depositar) sus DAI Tokens.
     * @param _amount Cantidad de tokens que vamos a depositar.
     */
    function stakeTokens(uint _amount) public {
        require(_amount > 0, 'La cantidad para hacer staking debe ser mayor a 0');

        daiToken.transferFrom(msg.sender, address(this), _amount); // Transfiere la cantidad indicada al contrato para hacer staking.
        
        stakingBalance[msg.sender] += _amount; // Actualiza el balance del usuario en la plataforma.

        // Añade un usuario al array de stakers solo si no han hecho stake anteriormente
        if(!hasStaked[msg.sender]) {
            stakers.push(msg.sender);
        }

        isStaking[msg.sender] = true;
        hasStaked[msg.sender] = true; // Actualiza el estado de staking
    }

    /**
     * @notice Función que permite al inversor hacer unstake (retirar) sus DAI Tokens.
     */
    function unstakeTokens() public {
        uint balance = stakingBalance[msg.sender]; // Balance de la persona que solicita el unstake.
        require(balance > 0, 'El balance de staking debe ser mayor a 0');

        daiToken.transfer(msg.sender, balance); // Transfiere Mock DAI tokens desde este contrato a la billetera del inversor.

        stakingBalance[msg.sender] = 0; // Resetea el balance de staking del inversor.

        isStaking[msg.sender] = false; // Actualiza el estado de staking del inversor.
    }

    /**
     * @notice Función que premia a los usuarios que están haciendo staking enviandoles Dapp Tokens. 1 DAI Token = 1 Dapp Token.
     */
    function issueToken() public {
        require(msg.sender == owner, 'Caller must be the owner');

        // Envía rewards a todos los stakers.
        // 1 DAI Token = 1 Dapp Token de reward.
        for(uint _i = 0; _i < stakers.length; _i++) {
            address recipient = stakers[_i];
            uint balance = stakingBalance[recipient];

            if(balance > 0) {
                dappToken.transfer(recipient, balance);
            }
        }
    }
}