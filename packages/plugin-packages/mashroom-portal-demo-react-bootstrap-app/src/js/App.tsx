import React, {useState} from 'react';
import {Button, Card, Placeholder, ProgressBar, Toast, Table, Badge} from 'react-bootstrap';
import BootstrapLogo from '../assets/Bootstrap_logo.svg';

export default () => {
    const [showToast, setShowToast] = useState(false);

    return (
        <div className='p-3'>
            <h4>
                React Boostrap Demo App <Badge bg="secondary">New</Badge>
            </h4>
            <div className="d-flex gap-3 py-2">
                <Card style={{ width: '18rem' }}>
                    <Card.Img className="p-3" variant="top" src={BootstrapLogo}/>
                    <Card.Body>
                        <Card.Title>Card Title</Card.Title>
                        <Card.Text>
                            This Demo Microfrontend uses <a href="https://react-bootstrap.netlify.app/" target="_blank" rel="noreferrer">React Bootstrap</a> components.
                            <br/>
                            It does not deliver any styles itself, the actual (customized) Bootstrap styles must be provided by the Portal Theme.
                        </Card.Text>
                        <Button variant="primary">Go somewhere</Button>
                    </Card.Body>
                </Card>

                <Card style={{ width: '18rem' }}>
                    <Card.Header>
                        Second Card Header
                    </Card.Header>
                    <Card.Body>
                        <Placeholder as={Card.Title} animation="glow">
                            <Placeholder xs={6} />
                        </Placeholder>
                        <Placeholder as={Card.Text} animation="glow">
                            <Placeholder xs={7} /> <Placeholder xs={4} /> <Placeholder xs={4} />{' '}
                            <Placeholder xs={6} /> <Placeholder xs={8} />
                        </Placeholder>
                        <Placeholder.Button variant="primary" xs={6} />
                    </Card.Body>
                </Card>
            </div>
            <div className="py-3">
                <ProgressBar animated now={45} />
            </div>
            <div>
                <Table striped bordered hover>
                    <thead>
                    <tr>
                        <th>#</th>
                        <th>First Name</th>
                        <th>Last Name</th>
                        <th>Username</th>
                    </tr>
                    </thead>
                    <tbody>
                    <tr>
                        <td>1</td>
                        <td>Mark</td>
                        <td>Otto</td>
                        <td>@mdo</td>
                    </tr>
                    <tr>
                        <td>2</td>
                        <td>Jacob</td>
                        <td>Thornton</td>
                        <td>@fat</td>
                    </tr>
                    <tr>
                        <td>3</td>
                        <td colSpan={2}>Larry the Bird</td>
                        <td>@twitter</td>
                    </tr>
                    </tbody>
                </Table>
            </div>
            <div className="d-flex gap-2 pt-2">
                <Button variant="primary" onClick={() => setShowToast(true)}>Open Toast</Button>
                <Button variant="secondary">Secondary Button</Button>
            </div>
            <div>
                <Toast show={showToast} onClose={() => setShowToast(false)}>
                    <Toast.Header>
                        <strong className="me-auto">Bootstrap</strong>
                        <small>11 mins ago</small>
                    </Toast.Header>
                    <Toast.Body>Woohoo, you&#39;re reading this text in a Toast!</Toast.Body>
                </Toast>
            </div>
        </div>
    );
};
