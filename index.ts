import { Server } from "./server";

const server = new Server();

server.listen(port => {
    let protocol = 'http'
    if (process.env.SSL) {
        protocol += 's'
    }

    console.log(`Listening on ${protocol}://localhost:${port}`);

});