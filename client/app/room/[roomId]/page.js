import GameLobby from "@/components/RoomPage/GameLobby";

const page = async ({
    params,
}) => {
    const { roomId } = await params;
    return (
        <div className="lg:h-screen lg:overflow-hidden">
            <GameLobby
                roomId={roomId}
            />
        </div>
    )
}

export default page
